#!/bin/bash

echo "🎨 Downloading ONNX Style Transfer Models"
echo "========================================="

# Create models directory
mkdir -p web/models

# Models from official ONNX repository
models=(
    "mosaic-9.onnx|https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/mosaic-9.onnx"
    "candy-9.onnx|https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/candy-9.onnx"
    "rain-princess-9.onnx|https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/rain-princess-9.onnx"
    "udnie-9.onnx|https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/udnie-9.onnx"
    "pointilism-9.onnx|https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/pointilism-9.onnx"
)

cd web/models

for model_entry in "${models[@]}"; do
    IFS='|' read -r model_name model_url <<< "$model_entry"
    if [ ! -f "$model_name" ]; then
        echo "📥 Downloading $model_name..."
        curl -L -o "$model_name" "$model_url"
        
        if [ -f "$model_name" ]; then
            size=$(du -h "$model_name" | cut -f1)
            echo "✅ Downloaded $model_name ($size)"
        else
            echo "❌ Failed to download $model_name"
        fi
    else
        echo "✅ $model_name already exists"
    fi
done

echo ""
echo "🎉 Model download complete!"
echo "Total models: $(ls -1 *.onnx 2>/dev/null | wc -l)"
