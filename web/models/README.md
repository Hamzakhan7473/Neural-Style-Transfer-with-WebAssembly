# Neural Style Transfer Models

This directory contains ONNX models for neural style transfer.

## Model Sources
- **Official ONNX Repository**: Verified models from the ONNX Model Zoo
- **Hugging Face**: Community models (when available)  
- **Alternative Sources**: Additional artistic styles from community repositories
- **Fallback Models**: Renamed copies of working models for consistency

## Model Format
All models expect:
- Input: RGB image tensor [1, 3, H, W] in range [0, 255]
- Output: RGB image tensor [1, 3, H, W] in range [0, 255]

## Adding Custom Models
1. Place ONNX files in this directory
2. Update the model registry in ../app.js
3. Ensure models follow the fast-neural-style format

## Troubleshooting
- Models should be 3-15MB in size
- Test with small images (224x224) first
- Check console for loading errors
