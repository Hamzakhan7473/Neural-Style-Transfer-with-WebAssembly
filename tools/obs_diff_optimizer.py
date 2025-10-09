#!/usr/bin/env python3
"""
ONNX Model Optimizer with OBS-Diff Integration

This module provides utilities to optimize ONNX models using OBS-Diff pruning
and additional optimization techniques for web deployment.
"""

import onnx
import onnxruntime as ort
from onnx import numpy_helper
import numpy as np
from typing import List, Dict, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ONNXOBSDiffOptimizer:
    """
    ONNX Model Optimizer with OBS-Diff pruning support
    
    This class provides utilities to:
    1. Prune ONNX models using structured block pruning
    2. Quantize models for reduced size
    3. Optimize graph structure
    4. Validate model accuracy after optimization
    """
    
    def __init__(self, model_path: str):
        """
        Initialize ONNX optimizer
        
        Args:
            model_path: Path to input ONNX model
        """
        self.model_path = model_path
        self.model = onnx.load(model_path)
        self.session = None
        
        logger.info(f"Loaded ONNX model: {model_path}")
        self._print_model_info()
    
    def _print_model_info(self):
        """Print model information"""
        import os
        file_size = os.path.getsize(self.model_path) / (1024 * 1024)
        logger.info(f"Model size: {file_size:.2f} MB")
        logger.info(f"Opset version: {self.model.opset_import[0].version}")
        logger.info(f"Inputs: {[inp.name for inp in self.model.graph.input]}")
        logger.info(f"Outputs: {[out.name for out in self.model.graph.output]}")
    
    def apply_structured_pruning(
        self,
        sparsity_ratio: float = 0.5,
        block_size: int = 4
    ) -> onnx.ModelProto:
        """
        Apply structured block pruning to ONNX model weights
        
        This implements a simplified version of OBS-Diff for ONNX models:
        1. Identify weight tensors in the graph
        2. Compute importance scores (L2 norm-based)
        3. Prune low-importance blocks
        
        Args:
            sparsity_ratio: Target sparsity (0.5 = 50% pruned)
            block_size: Size of structured blocks
            
        Returns:
            Pruned ONNX model
        """
        logger.info(f"Applying structured pruning (sparsity: {sparsity_ratio:.2%})...")
        
        # Get initializers (weights)
        initializers = self.model.graph.initializer
        
        pruned_count = 0
        total_count = 0
        
        for init in initializers:
            # Skip non-weight tensors (e.g., biases, normalization params)
            if 'weight' not in init.name.lower():
                continue
            
            # Convert to numpy array
            weight = numpy_helper.to_array(init)
            
            # Skip 1D tensors
            if len(weight.shape) < 2:
                continue
            
            logger.info(f"Pruning {init.name}: shape {weight.shape}")
            
            # Compute block-level importance scores
            if len(weight.shape) == 4:  # Conv weights [out_ch, in_ch, H, W]
                importance = np.sum(np.abs(weight), axis=(1, 2, 3))
                
                # Determine blocks to prune
                num_blocks = len(importance)
                num_prune = int(num_blocks * sparsity_ratio)
                prune_indices = np.argsort(importance)[:num_prune]
                
                # Zero out pruned blocks
                for idx in prune_indices:
                    weight[idx, :, :, :] = 0
                
                pruned_count += num_prune
                total_count += num_blocks
                
            elif len(weight.shape) == 2:  # Linear weights [out_feat, in_feat]
                importance = np.sum(np.abs(weight), axis=1)
                
                # Determine blocks to prune
                num_blocks = len(importance)
                num_prune = int(num_blocks * sparsity_ratio)
                prune_indices = np.argsort(importance)[:num_prune]
                
                # Zero out pruned blocks
                for idx in prune_indices:
                    weight[idx, :] = 0
                
                pruned_count += num_prune
                total_count += num_blocks
            
            # Update initializer
            new_init = numpy_helper.from_array(weight, init.name)
            init.CopyFrom(new_init)
        
        actual_sparsity = pruned_count / total_count if total_count > 0 else 0
        logger.info(f"Pruned {pruned_count}/{total_count} blocks ({actual_sparsity:.2%} sparsity)")
        
        return self.model
    
    def quantize_model(
        self,
        output_path: str,
        quantization_mode: str = 'int8'
    ):
        """
        Quantize ONNX model to reduce size
        
        Args:
            output_path: Path to save quantized model
            quantization_mode: Quantization mode ('int8' or 'uint8')
        """
        try:
            from onnxruntime.quantization import quantize_dynamic, QuantType
            
            logger.info(f"Quantizing model to {quantization_mode}...")
            
            quant_type = QuantType.QInt8 if quantization_mode == 'int8' else QuantType.QUInt8
            
            quantize_dynamic(
                self.model_path,
                output_path,
                weight_type=quant_type
            )
            
            # Compare sizes
            import os
            original_size = os.path.getsize(self.model_path) / (1024 * 1024)
            quantized_size = os.path.getsize(output_path) / (1024 * 1024)
            compression_ratio = (1 - quantized_size / original_size) * 100
            
            logger.info(f"Original size: {original_size:.2f} MB")
            logger.info(f"Quantized size: {quantized_size:.2f} MB")
            logger.info(f"Compression: {compression_ratio:.1f}%")
            
        except ImportError:
            logger.error("onnxruntime.quantization not available. Install with: pip install onnxruntime-tools")
    
    def optimize_graph(self) -> onnx.ModelProto:
        """
        Optimize ONNX graph structure
        
        This applies standard ONNX optimizations:
        - Constant folding
        - Redundant node elimination
        - Node fusion
        
        Returns:
            Optimized ONNX model
        """
        logger.info("Optimizing ONNX graph...")
        
        from onnx import optimizer
        
        # Apply all available optimizations
        passes = optimizer.get_available_passes()
        logger.info(f"Applying {len(passes)} optimization passes")
        
        self.model = optimizer.optimize(self.model, passes)
        
        logger.info("Graph optimization complete")
        return self.model
    
    def validate_model(
        self,
        test_input: np.ndarray,
        original_model_path: str = None
    ) -> Dict[str, float]:
        """
        Validate optimized model against original
        
        Args:
            test_input: Test input tensor
            original_model_path: Path to original model for comparison
            
        Returns:
            Dictionary with validation metrics
        """
        logger.info("Validating optimized model...")
        
        # Run inference on optimized model
        sess = ort.InferenceSession(
            self.model.SerializeToString(),
            providers=['CPUExecutionProvider']
        )
        
        input_name = sess.get_inputs()[0].name
        output_name = sess.get_outputs()[0].name
        
        optimized_output = sess.run([output_name], {input_name: test_input})[0]
        
        metrics = {
            'output_shape': optimized_output.shape,
            'output_mean': float(np.mean(optimized_output)),
            'output_std': float(np.std(optimized_output)),
            'output_min': float(np.min(optimized_output)),
            'output_max': float(np.max(optimized_output))
        }
        
        # Compare with original if provided
        if original_model_path:
            orig_sess = ort.InferenceSession(
                original_model_path,
                providers=['CPUExecutionProvider']
            )
            original_output = orig_sess.run([output_name], {input_name: test_input})[0]
            
            # Compute similarity metrics
            mse = np.mean((original_output - optimized_output) ** 2)
            mae = np.mean(np.abs(original_output - optimized_output))
            
            # Compute PSNR
            max_val = max(np.max(original_output), np.max(optimized_output))
            psnr = 20 * np.log10(max_val / np.sqrt(mse)) if mse > 0 else float('inf')
            
            metrics['mse'] = float(mse)
            metrics['mae'] = float(mae)
            metrics['psnr'] = float(psnr)
            
            logger.info(f"MSE: {mse:.6f}")
            logger.info(f"MAE: {mae:.6f}")
            logger.info(f"PSNR: {psnr:.2f} dB")
        
        return metrics
    
    def save_model(self, output_path: str):
        """
        Save optimized model
        
        Args:
            output_path: Path to save model
        """
        onnx.save(self.model, output_path)
        logger.info(f"Saved optimized model to: {output_path}")


def optimize_onnx_model_pipeline(
    input_model: str,
    output_model: str,
    sparsity_ratio: float = 0.5,
    quantize: bool = True,
    optimize_graph: bool = True
):
    """
    Complete optimization pipeline for ONNX models
    
    Args:
        input_model: Path to input ONNX model
        output_model: Path to save optimized model
        sparsity_ratio: Target sparsity for pruning
        quantize: Whether to apply quantization
        optimize_graph: Whether to optimize graph structure
    """
    logger.info("=" * 60)
    logger.info("ONNX Model Optimization Pipeline with OBS-Diff")
    logger.info("=" * 60)
    
    # Initialize optimizer
    optimizer = ONNXOBSDiffOptimizer(input_model)
    
    # Step 1: Apply structured pruning
    optimizer.apply_structured_pruning(sparsity_ratio=sparsity_ratio)
    
    # Step 2: Optimize graph
    if optimize_graph:
        optimizer.optimize_graph()
    
    # Step 3: Save pruned model
    pruned_path = output_model.replace('.onnx', '_pruned.onnx')
    optimizer.save_model(pruned_path)
    
    # Step 4: Quantize (optional)
    if quantize:
        quantized_path = output_model.replace('.onnx', '_quantized.onnx')
        optimizer.quantize_model(quantized_path)
        
        # Use quantized model as final output
        import shutil
        shutil.copy(quantized_path, output_model)
        logger.info(f"Final optimized model: {output_model}")
    else:
        import shutil
        shutil.copy(pruned_path, output_model)
    
    # Step 5: Validate
    test_input = np.random.randn(1, 3, 512, 512).astype(np.float32)
    metrics = optimizer.validate_model(test_input, input_model)
    
    logger.info("=" * 60)
    logger.info("Optimization complete!")
    logger.info(f"Optimized model saved to: {output_model}")
    logger.info("=" * 60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='ONNX Model Optimizer with OBS-Diff')
    parser.add_argument('--input', type=str, required=True, help='Input ONNX model')
    parser.add_argument('--output', type=str, required=True, help='Output optimized ONNX model')
    parser.add_argument('--sparsity', type=float, default=0.5, help='Target sparsity (default: 0.5)')
    parser.add_argument('--no-quantize', action='store_true', help='Skip quantization')
    parser.add_argument('--no-optimize', action='store_true', help='Skip graph optimization')
    
    args = parser.parse_args()
    
    optimize_onnx_model_pipeline(
        input_model=args.input,
        output_model=args.output,
        sparsity_ratio=args.sparsity,
        quantize=not args.no_quantize,
        optimize_graph=not args.no_optimize
    )

