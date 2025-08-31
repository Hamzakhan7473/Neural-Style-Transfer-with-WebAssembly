# ONNX Models Directory

Place your ONNX style transfer models in this directory. The models should be compatible with the WONNX runtime and follow the specifications defined in `../styles.json`.

## Model Requirements

- **Format**: ONNX format (`.onnx` files)
- **Input**: RGB images with dimensions specified in `styles.json`
- **Output**: Stylized RGB images with the same dimensions as input
- **Size**: Recommended under 5MB for web performance

## Example Models

The following models are referenced in `styles.json`:

- `vangogh.onnx` - Van Gogh style (2.1MB, 256x256)
- `picasso.onnx` - Picasso style (1.8MB, 256x256)  
- `cyberpunk.onnx` - Cyberpunk style (2.3MB, 256x256)
- `oil.onnx` - Oil painting style (1.9MB, 256x256)

## Converting Your Models

Use the `tools/export_to_onnx.py` script to convert TensorFlow/Keras models to ONNX:

```bash
python tools/export_to_onnx.py \
  --model_path /path/to/your/model \
  --output_path web/models/your_style.onnx \
  --input_width 256 \
  --input_height 256
```

## Updating styles.json

After adding a new model, update `../styles.json` with the correct metadata:

```json
{
  "id": "your_style",
  "name": "Your Style Name",
  "size": "X.XMB",
  "model_url": "./models/your_style.onnx",
  "input_name": "input",
  "output_name": "output", 
  "input_width": 256,
  "input_height": 256,
  "mean": [0.485, 0.456, 0.406],
  "std": [0.229, 0.224, 0.225],
  "scale": 255.0
}
```

## Model Sources

You can find pre-trained style transfer models from:
- [Hugging Face](https://huggingface.co/models?search=style+transfer)
- [ONNX Model Zoo](https://github.com/onnx/models)
- [TensorFlow Hub](https://tfhub.dev/s?deployment-format=lite&module-type=image-style-transfer)

Remember to respect the licenses of any models you use.
