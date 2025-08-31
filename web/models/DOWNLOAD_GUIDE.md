# Manual ONNX Model Download Guide

Since automatic downloads failed, here are manual steps to get working ONNX models for your Neural Style Transfer app.

## Option 1: ONNX Model Zoo (Recommended)

1. **Visit the ONNX Model Zoo**: https://github.com/onnx/models
2. **Navigate to**: `vision/style_transfer/fast_neural_style/`
3. **Download these models**:
   - `fast-neural-style-1.onnx` → rename to `starry_night.onnx`
   - `fast-neural-style-2.onnx` → rename to `picasso_cubist.onnx`
   - `fast-neural-style-3.onnx` → rename to `ukiyo_e.onnx`
   - `fast-neural-style-4.onnx` → rename to `cyberpunk.onnx`
   - `fast-neural-style-5.onnx` → rename to `abstract_expr.onnx`

## Option 2: Hugging Face Models

1. **Visit**: https://huggingface.co/models?search=style+transfer
2. **Search for**: "fast neural style" or "style transfer onnx"
3. **Download models** and rename them according to the list above

## Option 3: TensorFlow Hub

1. **Visit**: https://tfhub.dev/s?deployment-format=lite&module-type=image-style-transfer
2. **Download TensorFlow models** and convert them using the `tools/export_to_onnx.py` script

## Option 4: Pre-trained Models from Research Papers

### Fast Neural Style Transfer Models
- **Paper**: "Perceptual Losses for Real-Time Style Transfer and Super-Resolution"
- **GitHub**: https://github.com/jcjohnson/fast-neural-style
- **Convert to ONNX** using PyTorch → ONNX conversion

### Arbitrary Style Transfer Models
- **Paper**: "Arbitrary Style Transfer in Real-time with Adaptive Instance Normalization"
- **GitHub**: https://github.com/xunhuang1995/AdaIN-style
- **Convert to ONNX** using PyTorch → ONNX conversion

## Option 5: Use the Export Script

If you have your own trained models:

```bash
cd tools
python3 export_to_onnx.py \
  --model_path /path/to/your/model \
  --output_path ../web/models/your_style.onnx \
  --input_width 512 \
  --input_height 512
```

## Model Requirements

Your models must meet these specifications:
- **Format**: ONNX (.onnx)
- **Input**: RGB images (512x512x3)
- **Output**: RGB images (512x512x3)
- **Preprocessing**: 
  - Mean: [0.485, 0.456, 0.406]
  - Std: [0.229, 0.224, 0.225]
  - Scale: 255.0

## Quick Test Setup

For immediate testing without real models:

1. **Keep the placeholder models** (they allow the UI to work)
2. **Test the application interface**:
   - Upload images
   - Select styles
   - Test the UI responsiveness
3. **Note**: Style transfer won't work until real models are added

## Model Conversion Tools

### PyTorch to ONNX
```python
import torch
import torch.onnx

# Load your PyTorch model
model = torch.load('your_model.pth')
model.eval()

# Create dummy input
dummy_input = torch.randn(1, 3, 512, 512)

# Export to ONNX
torch.onnx.export(model, dummy_input, "output.onnx",
                  export_params=True, opset_version=11)
```

### TensorFlow to ONNX
```bash
pip install tf2onnx
python -m tf2onnx.convert --saved-model /path/to/model --output model.onnx
```

## Troubleshooting

### Common Issues:
1. **Model not found**: Ensure model files are in `web/models/` directory
2. **Input shape mismatch**: Models must accept 512x512x3 RGB input
3. **ONNX version**: Use ONNX opset 11 or higher
4. **File permissions**: Ensure models are readable by the web server

### Validation:
Test your ONNX models with:
```python
import onnx
model = onnx.load("your_model.onnx")
onnx.checker.check_model(model)
print(f"Model inputs: {[input.name for input in model.graph.input]}")
print(f"Model outputs: {[output.name for output in model.graph.output]}")
```

## Next Steps

1. **Download at least one working model** from the sources above
2. **Place it in the `web/models/` directory**
3. **Restart your web server** if needed
4. **Test the full application** with real style transfer

## Support

If you continue having issues:
- Check the browser console for error messages
- Verify model file integrity
- Ensure ONNX runtime compatibility
- Consider using smaller input dimensions (256x256) for testing
