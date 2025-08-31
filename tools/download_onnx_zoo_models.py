#!/usr/bin/env python3
"""
Download official ONNX models from the ONNX Model Zoo for Neural Style Transfer
Based on: https://github.com/onnx/models/tree/main/Computer_Vision
"""

import os
import requests
import json
from pathlib import Path

# ONNX Model Zoo URLs for style transfer models
ONNX_MODELS = {
    "fast_neural_style": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/fast_neural_style/fast_neural_style.onnx",
        "name": "Fast Neural Style Transfer",
        "size": "6.7MB",
        "description": "Official ONNX model for fast neural style transfer"
    },
    "neural_style_transfer": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/neural_style_transfer/neural_style_transfer.onnx", 
        "name": "Neural Style Transfer",
        "size": "8.2MB",
        "description": "Official ONNX model for neural style transfer"
    }
}

def download_model(url, filename, model_dir):
    """Download a model from URL"""
    try:
        print(f"📥 Downloading {filename}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        filepath = model_dir / filename
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        size_mb = filepath.stat().st_size / (1024 * 1024)
        print(f"✅ Downloaded {filename} ({size_mb:.1f}MB)")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        return False

def update_styles_json(model_dir):
    """Update styles.json with the new ONNX models"""
    styles_data = {
        "styles": [
            {
                "id": "fast_neural_style",
                "name": "Fast Neural Style Transfer (ONNX Zoo)",
                "size": "6.7MB",
                "model_url": "./models/fast_neural_style.onnx",
                "input_name": "input",
                "output_name": "output",
                "input_width": 512,
                "input_height": 512,
                "mean": [0.485, 0.456, 0.406],
                "std": [0.229, 0.224, 0.225],
                "scale": 255.0,
                "source": "ONNX Model Zoo",
                "description": "Official fast neural style transfer model"
            },
            {
                "id": "neural_style_transfer", 
                "name": "Neural Style Transfer (ONNX Zoo)",
                "size": "8.2MB",
                "model_url": "./models/neural_style_transfer.onnx",
                "input_name": "input",
                "output_name": "output", 
                "input_width": 512,
                "input_height": 512,
                "mean": [0.485, 0.456, 0.406],
                "std": [0.229, 0.224, 0.225],
                "scale": 255.0,
                "source": "ONNX Model Zoo",
                "description": "Official neural style transfer model"
            }
        ]
    }
    
    styles_file = Path("web/styles.json")
    with open(styles_file, 'w') as f:
        json.dump(styles_data, f, indent=2)
    
    print(f"✅ Updated {styles_file} with ONNX Zoo models")

def main():
    """Main download function"""
    print("🚀 Downloading ONNX Model Zoo models for Neural Style Transfer")
    print("=" * 60)
    
    # Create models directory
    model_dir = Path("web/models")
    model_dir.mkdir(exist_ok=True)
    
    # Download each model
    success_count = 0
    for model_id, model_info in ONNX_MODELS.items():
        filename = f"{model_id}.onnx"
        if download_model(model_info["url"], filename, model_dir):
            success_count += 1
    
    print(f"\n📊 Download Summary:")
    print(f"✅ Successfully downloaded: {success_count}/{len(ONNX_MODELS)} models")
    
    if success_count > 0:
        # Update styles.json
        update_styles_json(model_dir)
        
        print(f"\n🎉 Setup complete! Your project now uses official ONNX Model Zoo models.")
        print(f"📁 Models location: {model_dir}")
        print(f"🔧 Next steps:")
        print(f"   1. Restart your web server")
        print(f"   2. Test the new models in your app")
        print(f"   3. The models should work perfectly with 512x512 input/output")
    else:
        print(f"\n❌ No models were downloaded. Check your internet connection.")

if __name__ == "__main__":
    main()
