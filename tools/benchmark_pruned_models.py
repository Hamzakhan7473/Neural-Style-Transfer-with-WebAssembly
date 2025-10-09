#!/usr/bin/env python3
"""
Benchmark script for comparing original vs pruned models

This script evaluates:
1. Inference speed (latency)
2. Model size (compression ratio)
3. Output quality (PSNR, SSIM)
4. Memory usage
"""

import onnxruntime as ort
import numpy as np
import time
from typing import Dict, List, Tuple
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelBenchmark:
    """
    Benchmark utility for comparing model performance
    """
    
    def __init__(
        self,
        original_model: str,
        pruned_model: str,
        test_images: List[np.ndarray]
    ):
        """
        Initialize benchmark
        
        Args:
            original_model: Path to original ONNX model
            pruned_model: Path to pruned ONNX model
            test_images: List of test input images
        """
        self.original_model = original_model
        self.pruned_model = pruned_model
        self.test_images = test_images
        
        # Load sessions
        self.original_session = ort.InferenceSession(
            original_model,
            providers=['CPUExecutionProvider']
        )
        self.pruned_session = ort.InferenceSession(
            pruned_model,
            providers=['CPUExecutionProvider']
        )
        
        logger.info(f"Loaded original model: {original_model}")
        logger.info(f"Loaded pruned model: {pruned_model}")
    
    def benchmark_inference_speed(self, num_runs: int = 100) -> Dict[str, float]:
        """
        Measure inference latency
        
        Args:
            num_runs: Number of inference runs for averaging
            
        Returns:
            Dictionary with latency statistics
        """
        logger.info(f"Benchmarking inference speed ({num_runs} runs)...")
        
        input_name = self.original_session.get_inputs()[0].name
        output_name = self.original_session.get_outputs()[0].name
        
        # Use first test image
        test_input = self.test_images[0]
        
        # Warmup
        for _ in range(10):
            self.original_session.run([output_name], {input_name: test_input})
            self.pruned_session.run([output_name], {input_name: test_input})
        
        # Benchmark original model
        original_times = []
        for _ in range(num_runs):
            start = time.perf_counter()
            self.original_session.run([output_name], {input_name: test_input})
            end = time.perf_counter()
            original_times.append(end - start)
        
        # Benchmark pruned model
        pruned_times = []
        for _ in range(num_runs):
            start = time.perf_counter()
            self.pruned_session.run([output_name], {input_name: test_input})
            end = time.perf_counter()
            pruned_times.append(end - start)
        
        original_avg = np.mean(original_times) * 1000  # Convert to ms
        original_std = np.std(original_times) * 1000
        pruned_avg = np.mean(pruned_times) * 1000
        pruned_std = np.std(pruned_times) * 1000
        
        speedup = original_avg / pruned_avg
        
        results = {
            'original_latency_ms': float(original_avg),
            'original_latency_std_ms': float(original_std),
            'pruned_latency_ms': float(pruned_avg),
            'pruned_latency_std_ms': float(pruned_std),
            'speedup': float(speedup),
            'latency_reduction_percent': float((1 - pruned_avg / original_avg) * 100)
        }
        
        logger.info(f"Original latency: {original_avg:.2f} ± {original_std:.2f} ms")
        logger.info(f"Pruned latency: {pruned_avg:.2f} ± {pruned_std:.2f} ms")
        logger.info(f"Speedup: {speedup:.2f}x")
        
        return results
    
    def benchmark_model_size(self) -> Dict[str, float]:
        """
        Compare model sizes
        
        Returns:
            Dictionary with size metrics
        """
        logger.info("Comparing model sizes...")
        
        original_size = Path(self.original_model).stat().st_size / (1024 * 1024)
        pruned_size = Path(self.pruned_model).stat().st_size / (1024 * 1024)
        
        compression_ratio = original_size / pruned_size
        size_reduction = (1 - pruned_size / original_size) * 100
        
        results = {
            'original_size_mb': float(original_size),
            'pruned_size_mb': float(pruned_size),
            'compression_ratio': float(compression_ratio),
            'size_reduction_percent': float(size_reduction)
        }
        
        logger.info(f"Original size: {original_size:.2f} MB")
        logger.info(f"Pruned size: {pruned_size:.2f} MB")
        logger.info(f"Compression ratio: {compression_ratio:.2f}x")
        logger.info(f"Size reduction: {size_reduction:.1f}%")
        
        return results
    
    def benchmark_output_quality(self) -> Dict[str, float]:
        """
        Compare output quality using PSNR and SSIM
        
        Returns:
            Dictionary with quality metrics
        """
        logger.info("Comparing output quality...")
        
        input_name = self.original_session.get_inputs()[0].name
        output_name = self.original_session.get_outputs()[0].name
        
        psnr_scores = []
        ssim_scores = []
        mse_scores = []
        
        for test_input in self.test_images:
            # Run inference
            original_output = self.original_session.run([output_name], {input_name: test_input})[0]
            pruned_output = self.pruned_session.run([output_name], {input_name: test_input})[0]
            
            # Compute MSE
            mse = np.mean((original_output - pruned_output) ** 2)
            mse_scores.append(mse)
            
            # Compute PSNR
            max_val = max(np.max(original_output), np.max(pruned_output))
            if mse > 0:
                psnr = 20 * np.log10(max_val / np.sqrt(mse))
            else:
                psnr = float('inf')
            psnr_scores.append(psnr)
            
            # Compute SSIM (simplified version)
            ssim = self._compute_ssim(original_output, pruned_output)
            ssim_scores.append(ssim)
        
        results = {
            'mean_psnr_db': float(np.mean(psnr_scores)),
            'std_psnr_db': float(np.std(psnr_scores)),
            'mean_ssim': float(np.mean(ssim_scores)),
            'std_ssim': float(np.std(ssim_scores)),
            'mean_mse': float(np.mean(mse_scores))
        }
        
        logger.info(f"Mean PSNR: {np.mean(psnr_scores):.2f} ± {np.std(psnr_scores):.2f} dB")
        logger.info(f"Mean SSIM: {np.mean(ssim_scores):.4f} ± {np.std(ssim_scores):.4f}")
        logger.info(f"Mean MSE: {np.mean(mse_scores):.6f}")
        
        return results
    
    def _compute_ssim(self, img1: np.ndarray, img2: np.ndarray) -> float:
        """
        Compute simplified SSIM between two images
        
        Args:
            img1: First image
            img2: Second image
            
        Returns:
            SSIM score
        """
        # Constants
        C1 = (0.01 * 255) ** 2
        C2 = (0.03 * 255) ** 2
        
        # Compute means
        mu1 = np.mean(img1)
        mu2 = np.mean(img2)
        
        # Compute variances and covariance
        sigma1_sq = np.var(img1)
        sigma2_sq = np.var(img2)
        sigma12 = np.mean((img1 - mu1) * (img2 - mu2))
        
        # Compute SSIM
        numerator = (2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)
        denominator = (mu1**2 + mu2**2 + C1) * (sigma1_sq + sigma2_sq + C2)
        
        ssim = numerator / denominator
        return float(ssim)
    
    def run_full_benchmark(self) -> Dict[str, Dict]:
        """
        Run complete benchmark suite
        
        Returns:
            Dictionary with all benchmark results
        """
        logger.info("=" * 60)
        logger.info("Running Full Benchmark Suite")
        logger.info("=" * 60)
        
        results = {}
        
        # Inference speed
        results['inference_speed'] = self.benchmark_inference_speed()
        
        # Model size
        results['model_size'] = self.benchmark_model_size()
        
        # Output quality
        results['output_quality'] = self.benchmark_output_quality()
        
        logger.info("=" * 60)
        logger.info("Benchmark Complete!")
        logger.info("=" * 60)
        
        return results
    
    def save_results(self, output_path: str):
        """
        Save benchmark results to JSON
        
        Args:
            output_path: Path to save results
        """
        results = self.run_full_benchmark()
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Benchmark results saved to: {output_path}")


def generate_test_images(num_images: int = 10, size: Tuple[int, int] = (512, 512)) -> List[np.ndarray]:
    """
    Generate synthetic test images
    
    Args:
        num_images: Number of test images to generate
        size: Image size (H, W)
        
    Returns:
        List of test images
    """
    images = []
    for _ in range(num_images):
        # Generate random RGB image
        img = np.random.rand(1, 3, size[0], size[1]).astype(np.float32) * 255
        images.append(img)
    
    return images


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Benchmark Pruned Models')
    parser.add_argument('--original', type=str, required=True, help='Original ONNX model')
    parser.add_argument('--pruned', type=str, required=True, help='Pruned ONNX model')
    parser.add_argument('--num-images', type=int, default=10, help='Number of test images')
    parser.add_argument('--num-runs', type=int, default=100, help='Number of inference runs')
    parser.add_argument('--output', type=str, default='benchmark_results.json', help='Output results file')
    
    args = parser.parse_args()
    
    # Generate test images
    test_images = generate_test_images(num_images=args.num_images)
    
    # Run benchmark
    benchmark = ModelBenchmark(args.original, args.pruned, test_images)
    benchmark.save_results(args.output)

