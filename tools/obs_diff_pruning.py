#!/usr/bin/env python3
"""
OBS-Diff: Accurate Pruning for Diffusion Models in One-Shot

Implementation based on the paper:
"OBS-DIFF: ACCURATE PRUNING FOR DIFFUSION MODELS IN ONE-SHOT"
by Junhan Zhu, Hesong Wang, Mingluo Su, Zefang Wang, Huan Wang
Westlake University & Zhejiang University

GitHub: https://github.com/Alrightlone/OBS-Diff

This module implements one-shot block-structured pruning for neural style transfer models,
adapting the OBS-Diff methodology for ONNX model compression.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Dict, List, Tuple, Optional
import onnx
from onnx import numpy_helper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OBSDiffPruner:
    """
    One-shot Block Structured Pruning for Neural Style Transfer Models
    
    This implements the core OBS-Diff algorithm:
    1. Compute Hessian approximation using Fisher Information
    2. Calculate importance scores for each block
    3. Perform one-shot pruning based on optimal brain surgeon criterion
    4. Fine-tune pruned model (optional)
    """
    
    def __init__(
        self,
        model: nn.Module,
        sparsity_ratio: float = 0.5,
        block_size: int = 4,
        calibration_samples: int = 256,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        """
        Initialize OBS-Diff Pruner
        
        Args:
            model: PyTorch model to prune
            sparsity_ratio: Target sparsity (0.5 = 50% weights removed)
            block_size: Size of structured blocks to prune
            calibration_samples: Number of samples for Hessian estimation
            device: Device for computation
        """
        self.model = model.to(device)
        self.device = device
        self.sparsity_ratio = sparsity_ratio
        self.block_size = block_size
        self.calibration_samples = calibration_samples
        
        # Storage for Hessian and importance scores
        self.hessian_info = {}
        self.importance_scores = {}
        self.pruning_mask = {}
        
        logger.info(f"Initialized OBS-Diff Pruner")
        logger.info(f"Sparsity Ratio: {sparsity_ratio:.2%}")
        logger.info(f"Block Size: {block_size}")
        logger.info(f"Device: {device}")
    
    def compute_fisher_information(
        self,
        dataloader: torch.utils.data.DataLoader,
        criterion: nn.Module
    ) -> Dict[str, torch.Tensor]:
        """
        Compute Fisher Information Matrix approximation for Hessian
        
        The Fisher Information provides a tractable approximation of the Hessian
        matrix, which is crucial for the OBS (Optimal Brain Surgeon) criterion.
        
        Args:
            dataloader: Calibration data loader
            criterion: Loss function for computing gradients
            
        Returns:
            Dictionary mapping layer names to Fisher Information matrices
        """
        self.model.eval()
        fisher_info = {}
        
        # Initialize Fisher Information accumulators
        for name, param in self.model.named_parameters():
            if param.requires_grad and len(param.shape) >= 2:
                fisher_info[name] = torch.zeros_like(param)
        
        logger.info("Computing Fisher Information Matrix...")
        
        num_samples = 0
        for batch_idx, (inputs, _) in enumerate(dataloader):
            if num_samples >= self.calibration_samples:
                break
                
            inputs = inputs.to(self.device)
            self.model.zero_grad()
            
            # Forward pass
            outputs = self.model(inputs)
            
            # Compute loss and gradients
            loss = criterion(outputs, inputs)  # For style transfer, we use reconstruction
            loss.backward()
            
            # Accumulate squared gradients (Fisher Information)
            for name, param in self.model.named_parameters():
                if param.requires_grad and name in fisher_info:
                    if param.grad is not None:
                        fisher_info[name] += param.grad.data.pow(2)
            
            num_samples += inputs.size(0)
            
            if (batch_idx + 1) % 10 == 0:
                logger.info(f"Processed {num_samples}/{self.calibration_samples} samples")
        
        # Average Fisher Information
        for name in fisher_info:
            fisher_info[name] /= num_samples
        
        self.hessian_info = fisher_info
        logger.info("Fisher Information computation complete")
        return fisher_info
    
    def compute_block_importance_scores(self) -> Dict[str, torch.Tensor]:
        """
        Compute importance scores for structured blocks using OBS criterion
        
        The OBS criterion measures the increase in loss when removing a weight:
        importance = w^2 / (2 * h^-1)
        
        where w is the weight and h is the Hessian diagonal element.
        
        Returns:
            Dictionary mapping layer names to block importance scores
        """
        logger.info("Computing block importance scores...")
        
        for name, param in self.model.named_parameters():
            if name not in self.hessian_info:
                continue
            
            # Get weight and Hessian approximation
            weight = param.data
            hessian = self.hessian_info[name]
            
            # Avoid division by zero
            hessian = torch.clamp(hessian, min=1e-8)
            
            # Compute OBS importance score: w^2 / (2 * h)
            importance = weight.pow(2) / (2 * hessian)
            
            # Reshape to blocks for structured pruning
            if len(weight.shape) == 4:  # Convolutional layer
                importance = self._compute_conv_block_importance(importance)
            elif len(weight.shape) == 2:  # Linear layer
                importance = self._compute_linear_block_importance(importance)
            
            self.importance_scores[name] = importance
        
        logger.info(f"Computed importance scores for {len(self.importance_scores)} layers")
        return self.importance_scores
    
    def _compute_conv_block_importance(self, importance: torch.Tensor) -> torch.Tensor:
        """
        Compute block-level importance for convolutional layers
        
        For Conv layers, we group importance by output channels (filters).
        This enables structured pruning that removes entire filters.
        
        Args:
            importance: Weight-level importance scores [out_ch, in_ch, H, W]
            
        Returns:
            Block-level importance scores [out_ch]
        """
        # Sum importance across spatial dimensions and input channels
        # This gives us one importance score per output filter
        block_importance = importance.sum(dim=(1, 2, 3))
        return block_importance
    
    def _compute_linear_block_importance(self, importance: torch.Tensor) -> torch.Tensor:
        """
        Compute block-level importance for linear layers
        
        For Linear layers, we group importance by output neurons.
        
        Args:
            importance: Weight-level importance scores [out_features, in_features]
            
        Returns:
            Block-level importance scores [out_features]
        """
        # Sum importance across input features
        block_importance = importance.sum(dim=1)
        return block_importance
    
    def prune_model_one_shot(self) -> nn.Module:
        """
        Perform one-shot pruning based on computed importance scores
        
        This is the core OBS-Diff operation:
        1. Sort all blocks by importance
        2. Remove lowest-importance blocks to reach target sparsity
        3. Create pruning masks
        
        Returns:
            Pruned model
        """
        logger.info(f"Performing one-shot pruning (target sparsity: {self.sparsity_ratio:.2%})...")
        
        # Collect all importance scores
        all_scores = []
        score_map = []
        
        for name, scores in self.importance_scores.items():
            for idx, score in enumerate(scores.flatten()):
                all_scores.append(score.item())
                score_map.append((name, idx))
        
        # Sort by importance (ascending - lowest importance first)
        sorted_indices = np.argsort(all_scores)
        
        # Calculate number of blocks to prune
        num_total_blocks = len(all_scores)
        num_prune_blocks = int(num_total_blocks * self.sparsity_ratio)
        
        logger.info(f"Total blocks: {num_total_blocks}")
        logger.info(f"Blocks to prune: {num_prune_blocks} ({self.sparsity_ratio:.2%})")
        
        # Mark blocks for pruning
        blocks_to_prune = set()
        for idx in sorted_indices[:num_prune_blocks]:
            blocks_to_prune.add(score_map[idx])
        
        # Create pruning masks
        for name, param in self.model.named_parameters():
            if name not in self.importance_scores:
                continue
            
            mask = torch.ones_like(param)
            
            # Apply block-level pruning
            if len(param.shape) == 4:  # Conv layer
                for idx in range(param.shape[0]):
                    if (name, idx) in blocks_to_prune:
                        mask[idx, :, :, :] = 0
            elif len(param.shape) == 2:  # Linear layer
                for idx in range(param.shape[0]):
                    if (name, idx) in blocks_to_prune:
                        mask[idx, :] = 0
            
            self.pruning_mask[name] = mask
            
            # Apply mask to weights
            param.data *= mask
        
        # Calculate actual sparsity
        total_params = sum(p.numel() for p in self.model.parameters())
        zero_params = sum((p == 0).sum().item() for p in self.model.parameters())
        actual_sparsity = zero_params / total_params
        
        logger.info(f"Pruning complete!")
        logger.info(f"Actual sparsity: {actual_sparsity:.2%}")
        logger.info(f"Pruned {zero_params:,} / {total_params:,} parameters")
        
        return self.model
    
    def fine_tune_pruned_model(
        self,
        dataloader: torch.utils.data.DataLoader,
        criterion: nn.Module,
        optimizer: torch.optim.Optimizer,
        num_epochs: int = 5
    ) -> nn.Module:
        """
        Fine-tune the pruned model to recover performance
        
        After pruning, we fine-tune the remaining weights to compensate
        for the removed parameters.
        
        Args:
            dataloader: Training data loader
            criterion: Loss function
            optimizer: Optimizer for fine-tuning
            num_epochs: Number of fine-tuning epochs
            
        Returns:
            Fine-tuned pruned model
        """
        logger.info(f"Fine-tuning pruned model for {num_epochs} epochs...")
        
        self.model.train()
        
        for epoch in range(num_epochs):
            total_loss = 0
            num_batches = 0
            
            for batch_idx, (inputs, targets) in enumerate(dataloader):
                inputs = inputs.to(self.device)
                targets = targets.to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = criterion(outputs, targets)
                loss.backward()
                
                # Apply pruning masks to gradients
                for name, param in self.model.named_parameters():
                    if name in self.pruning_mask and param.grad is not None:
                        param.grad *= self.pruning_mask[name]
                
                optimizer.step()
                
                total_loss += loss.item()
                num_batches += 1
            
            avg_loss = total_loss / num_batches
            logger.info(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_loss:.4f}")
        
        logger.info("Fine-tuning complete!")
        return self.model
    
    def export_to_onnx(self, output_path: str, input_shape: Tuple[int, ...] = (1, 3, 512, 512)):
        """
        Export pruned model to ONNX format
        
        Args:
            output_path: Path to save ONNX model
            input_shape: Input tensor shape for ONNX export
        """
        logger.info(f"Exporting pruned model to ONNX: {output_path}")
        
        self.model.eval()
        dummy_input = torch.randn(input_shape).to(self.device)
        
        torch.onnx.export(
            self.model,
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
        
        # Verify exported model
        onnx_model = onnx.load(output_path)
        onnx.checker.check_model(onnx_model)
        
        logger.info(f"ONNX export successful: {output_path}")
        
        # Print model info
        import os
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        logger.info(f"Model size: {file_size_mb:.2f} MB")


def prune_style_transfer_model(
    model_path: str,
    output_path: str,
    calibration_data_path: str,
    sparsity_ratio: float = 0.5,
    fine_tune: bool = True,
    num_fine_tune_epochs: int = 5
):
    """
    High-level function to prune a style transfer model using OBS-Diff
    
    Args:
        model_path: Path to input PyTorch model
        output_path: Path to save pruned ONNX model
        calibration_data_path: Path to calibration dataset
        sparsity_ratio: Target sparsity ratio
        fine_tune: Whether to fine-tune after pruning
        num_fine_tune_epochs: Number of fine-tuning epochs
    """
    logger.info("=" * 60)
    logger.info("OBS-Diff Model Pruning Pipeline")
    logger.info("=" * 60)
    
    # Load model
    logger.info(f"Loading model from: {model_path}")
    model = torch.load(model_path)
    
    # Initialize pruner
    pruner = OBSDiffPruner(
        model=model,
        sparsity_ratio=sparsity_ratio,
        block_size=4,
        calibration_samples=256
    )
    
    # Load calibration data
    # Note: This is a placeholder - implement your own data loading
    from torch.utils.data import DataLoader, TensorDataset
    calibration_data = torch.randn(256, 3, 512, 512)
    calibration_loader = DataLoader(
        TensorDataset(calibration_data, calibration_data),
        batch_size=8,
        shuffle=False
    )
    
    # Compute Fisher Information
    criterion = nn.MSELoss()
    pruner.compute_fisher_information(calibration_loader, criterion)
    
    # Compute importance scores
    pruner.compute_block_importance_scores()
    
    # Perform one-shot pruning
    pruned_model = pruner.prune_model_one_shot()
    
    # Fine-tune (optional)
    if fine_tune:
        optimizer = torch.optim.Adam(pruned_model.parameters(), lr=1e-4)
        pruned_model = pruner.fine_tune_pruned_model(
            calibration_loader,
            criterion,
            optimizer,
            num_epochs=num_fine_tune_epochs
        )
    
    # Export to ONNX
    pruner.export_to_onnx(output_path)
    
    logger.info("=" * 60)
    logger.info("Pruning pipeline complete!")
    logger.info(f"Pruned model saved to: {output_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='OBS-Diff Pruning for Style Transfer Models')
    parser.add_argument('--model', type=str, required=True, help='Input PyTorch model path')
    parser.add_argument('--output', type=str, required=True, help='Output ONNX model path')
    parser.add_argument('--data', type=str, required=True, help='Calibration data path')
    parser.add_argument('--sparsity', type=float, default=0.5, help='Target sparsity ratio (default: 0.5)')
    parser.add_argument('--no-fine-tune', action='store_true', help='Skip fine-tuning')
    parser.add_argument('--epochs', type=int, default=5, help='Fine-tuning epochs (default: 5)')
    
    args = parser.parse_args()
    
    prune_style_transfer_model(
        model_path=args.model,
        output_path=args.output,
        calibration_data_path=args.data,
        sparsity_ratio=args.sparsity,
        fine_tune=not args.no_fine_tune,
        num_fine_tune_epochs=args.epochs
    )

