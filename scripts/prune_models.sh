#!/bin/bash
# Script to prune existing ONNX models using OBS-Diff

set -e

echo "=================================================="
echo "OBS-Diff Model Pruning Pipeline"
echo "=================================================="

# Configuration
MODELS_DIR="./web/models"
PRUNED_DIR="./web/models/pruned"
SPARSITY_RATIO=0.5
QUANTIZE=true

# Create output directory
mkdir -p "$PRUNED_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Configuration:${NC}"
echo "  Models directory: $MODELS_DIR"
echo "  Output directory: $PRUNED_DIR"
echo "  Sparsity ratio: $SPARSITY_RATIO"
echo "  Quantization: $QUANTIZE"
echo ""

# Check if Python dependencies are installed
echo -e "${BLUE}Checking dependencies...${NC}"
python3 -c "import onnx, onnxruntime, numpy" 2>/dev/null || {
    echo "Installing required Python packages..."
    pip install onnx onnxruntime numpy
}

# Process each ONNX model
for model in "$MODELS_DIR"/*.onnx; do
    if [ -f "$model" ]; then
        filename=$(basename "$model")
        output="$PRUNED_DIR/${filename%.onnx}_pruned.onnx"
        
        echo -e "${GREEN}Processing: $filename${NC}"
        
        # Run OBS-Diff optimizer
        python3 tools/obs_diff_optimizer.py \
            --input "$model" \
            --output "$output" \
            --sparsity "$SPARSITY_RATIO" \
            ${QUANTIZE:+} ${QUANTIZE:+} # Add --no-quantize if QUANTIZE is false
        
        echo -e "${GREEN}✓ Completed: $output${NC}"
        echo ""
    fi
done

# Run benchmarks
echo -e "${BLUE}Running benchmarks...${NC}"
for original in "$MODELS_DIR"/*.onnx; do
    if [ -f "$original" ]; then
        filename=$(basename "$original")
        pruned="$PRUNED_DIR/${filename%.onnx}_pruned_quantized.onnx"
        
        if [ -f "$pruned" ]; then
            echo -e "${GREEN}Benchmarking: $filename${NC}"
            python3 tools/benchmark_pruned_models.py \
                --original "$original" \
                --pruned "$pruned" \
                --num-images 10 \
                --num-runs 100 \
                --output "$PRUNED_DIR/${filename%.onnx}_benchmark.json"
        fi
    fi
done

echo ""
echo "=================================================="
echo "Pruning complete!"
echo "Pruned models saved to: $PRUNED_DIR"
echo "=================================================="

