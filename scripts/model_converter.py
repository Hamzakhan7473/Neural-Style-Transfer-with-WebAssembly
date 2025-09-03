#!/usr/bin/env python3
"""
Advanced model conversion utilities for style transfer models
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path

try:
    import torch
    import torchvision.transforms as transforms
    import onnx
    import onnxruntime as ort
    from PIL import Image
    HAS_PYTORCH = True
except ImportError:
    HAS_PYTORCH = False
    print("⚠️  PyTorch dependencies not found. Some features will be disabled.")

try:
    import tensorflow as tf
    import tf2onnx
    HAS_TENSORFLOW = True
except ImportError:
    HAS_TENSORFLOW = False
    print("⚠️  TensorFlow dependencies not found. TF conversion disabled.")

class ModelConverter:
    """Convert various model formats to optimized ONNX for WebAssembly"""
    
    def __init__(self, target_size: int = 512):
        self.target_size = target_size
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    def convert_pytorch_to_onnx(self, model_path: str, output_path: str):
        """Convert PyTorch model to ONNX"""
        if not HAS_PYTORCH:
            raise ImportError("PyTorch not available")
            
        print(f"🔄 Converting PyTorch model: {model_path}")
        
        # Load PyTorch model
        model = torch.jit.load(model_path, map_location=self.device)
        model.eval()
        
        # Create dummy input
        dummy_input = torch.randn(1, 3, self.target_size, self.target_size, device=self.device)
        
        # Export to ONNX
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=13,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        # Verify the conversion
        self._verify_onnx_model(output_path, dummy_input.cpu().numpy())
        print(f"✅ PyTorch conversion complete: {output_path}")
        
    def convert_tensorflow_to_onnx(self, model_path: str, output_path: str):
        """Convert TensorFlow SavedModel to ONNX"""
        if not HAS_TENSORFLOW:
            raise ImportError("TensorFlow not available")
            
        print(f"🔄 Converting TensorFlow model: {model_path}")
        
        # Convert using tf2onnx
        tf2onnx.convert.from_tensorflow(
            model_path,
            output_path=output_path,
            opset=13,
            inputs_as_nchw=['input:0'],
            outputs=['output:0']
        )
        
        print(f"✅ TensorFlow conversion complete: {output_path}")
        
    def optimize_for_web(self, input_path: str, output_path: str):
        """Optimize ONNX model specifically for WebAssembly deployment"""
        print(f"🔧 Optimizing for web deployment: {input_path}")
        
        import onnxoptimizer
        
        # Load model
        model = onnx.load(input_path)
        
        # Web-specific optimization passes
        optimization_passes = [
            'eliminate_deadend',
            'eliminate_identity', 
            'eliminate_nop_dropout',
            'eliminate_nop_pad',
            'eliminate_unused_initializer',
            'extract_constant_to_initializer',
            'fuse_add_bias_into_conv',
            'fuse_bn_into_conv',
            'fuse_consecutive_squeezes',
            'fuse_consecutive_transposes',
            'fuse_pad_into_conv',
            'fuse_transpose_into_gemm',
            'lift_lexical_references',
        ]
        
        # Apply optimizations
        optimized_model = onnxoptimizer.optimize(model, optimization_passes)
        
        # Additional web optimizations
        self._quantize_for_web(optimized_model)
        
        # Save optimized model
        onnx.save(optimized_model, output_path)
        
        # Report size reduction
        original_size = Path(input_path).stat().st_size
        optimized_size = Path(output_path).stat().st_size
        reduction = (1 - optimized_size / original_size) * 100
        
        print(f"✅ Web optimization complete:")
        print(f"   Size reduction: {reduction:.1f}%")
        print(f"   Final size: {optimized_size / 1024 / 1024:.1f} MB")
        
    def _quantize_for_web(self, model):
        """Apply quantization optimizations for web deployment"""
        try:
            from onnxruntime.quantization import quantize_dynamic, QuantType
            
            # Dynamic quantization to reduce model size
            # Note: This is a simplified example - real implementation would be more sophisticated
            pass
            
        except ImportError:
            print("⚠️  ONNX quantization tools not available")
            
    def _verify_onnx_model(self, model_path: str, test_input: np.ndarray):
        """Verify ONNX model works correctly"""
        try:
            # Create inference session
            session = ort.InferenceSession(model_path)
            
            # Get input/output names
            input_name = session.get_inputs()[0].name
            output_name = session.get_outputs()[0].name
            
            # Run inference
            result = session.run([output_name], {input_name: test_input})
            
            print(f"✅ Model verification passed")
            print(f"   Input shape: {test_input.shape}")
            print(f"   Output shape: {result[0].shape}")
            
        except Exception as e:
            print(f"❌ Model verification failed: {e}")
            raise
            
    def create_test_models(self, output_dir: Path):
        """Create simple test models for development"""
        if not HAS_PYTORCH:
            print("⚠️  Skipping test model creation - PyTorch not available")
            return
            
        print("🎨 Creating test style transfer models...")
        
        class SimpleStyleTransfer(torch.nn.Module):
            """Simple CNN for testing"""
            def __init__(self):
                super().__init__()
                self.conv1 = torch.nn.Conv2d(3, 32, 3, padding=1)
                self.conv2 = torch.nn.Conv2d(32, 32, 3, padding=1)
                self.conv3 = torch.nn.Conv2d(32, 3, 3, padding=1)
                self.relu = torch.nn.ReLU()
                self.tanh = torch.nn.Tanh()
                
            def forward(self, x):
                x = self.relu(self.conv1(x))
                x = self.relu(self.conv2(x))
                x = self.tanh(self.conv3(x))
                return x
        
        # Create and save test models
        styles = ['vangogh', 'picasso', 'monet', 'cyberpunk', 'ukiyo']
        
        for style in styles:
            model = SimpleStyleTransfer()
            model.eval()
            
            # Create random weights to simulate different styles
            torch.manual_seed(hash(style) % 2**31)
            for param in model.parameters():
                param.data = torch.randn_like(param.data) * 0.1
                
            output_path = output_dir / f"{style}-style.onnx"
            
            # Export to ONNX
            dummy_input = torch.randn(1, 3, self.target_size, self.target_size)
            torch.onnx.export(
                model,
                dummy_input,
                str(output_path),
                export_params=True,
                opset_version=13,
                input_names=['input'],
                output_names=['output']
            )
            
            print(f"✅ Created test model: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Convert ML models to web-optimized ONNX")
    parser.add_argument("--input", type=str, required=True, help="Input model path")
    parser.add_argument("--output", type=str, required=True, help="Output ONNX path")
    parser.add_argument("--format", choices=['pytorch', 'tensorflow', 'onnx'], required=True, help="Input format")
    parser.add_argument("--size", type=int, default=512, help="Target input size")
    parser.add_argument("--optimize", action='store_true', help="Apply web optimizations")
    parser.add_argument("--create-test-models", action='store_true', help="Create test models")
    
    args = parser.parse_args()
    
    converter = ModelConverter(args.size)
    
    if args.create_test_models:
        output_dir = Path(args.output)
        output_dir.mkdir(exist_ok=True)
        converter.create_test_models(output_dir)
        return
    
    # Convert model
    if args.format == 'pytorch':
        converter.convert_pytorch_to_onnx(args.input, args.output)
    elif args.format == 'tensorflow':
        converter.convert_tensorflow_to_onnx(args.input, args.output)
    elif args.format == 'onnx' and args.optimize:
        converter.optimize_for_web(args.input, args.output)
    
    print("🎉 Model conversion complete!")

if __name__ == "__main__":
    main()
