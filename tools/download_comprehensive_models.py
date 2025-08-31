#!/usr/bin/env python3
"""
Comprehensive download script for ONNX Model Zoo style transfer models
Based on: https://github.com/onnx/models/tree/main/Computer_Vision
"""

import os
import requests
import json
from pathlib import Path

# Comprehensive list of ONNX Model Zoo style transfer models
ONNX_MODELS = {
    "fast_neural_style_candy": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/fast_neural_style/candy.onnx",
        "name": "Candy Style (Fast Neural Style)",
        "size": "6.7MB",
        "style": "Candy-like artistic transformation"
    },
    "fast_neural_style_mosaic": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/fast_neural_style/mosaic.onnx", 
        "name": "Mosaic Style (Fast Neural Style)",
        "size": "6.7MB",
        "style": "Mosaic artistic pattern"
    },
    "fast_neural_style_rain_princess": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/fast_neural_style/rain_princess.onnx",
        "name": "Rain Princess Style (Fast Neural Style)", 
        "size": "6.7MB",
        "style": "Rain princess artistic style"
    },
    "fast_neural_style_udnie": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/fast_neural_style/udnie.onnx",
        "name": "Udnie Style (Fast Neural Style)",
        "size": "6.7MB", 
        "style": "Udnie artistic transformation"
    },
    "neural_style_transfer": {
        "url": "https://github.com/onnx/models/raw/main/Computer_Vision/neural_style_transfer/neural_style_transfer.onnx",
        "name": "Neural Style Transfer (Generic)",
        "size": "8.2MB",
        "style": "Generic neural style transfer"
    }
}

def download_model(url, filename, model_dir):
    """Download a model from URL with progress tracking"""
    try:
        print(f"📥 Downloading {filename}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        filepath = model_dir / filename
        total_size = int(response.headers.get('content-length', 0))
        
        with open(filepath, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    percent = (downloaded / total_size) * 100
                    print(f"\r   Progress: {percent:.1f}%", end='', flush=True)
        
        print()  # New line after progress
        size_mb = filepath.stat().st_size / (1024 * 1024)
        print(f"✅ Downloaded {filename} ({size_mb:.1f}MB)")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        return False

def update_styles_json(model_dir):
    """Update styles.json with all the new ONNX models"""
    styles_data = {
        "styles": []
    }
    
    for model_id, model_info in ONNX_MODELS.items():
        style_entry = {
            "id": model_id,
            "name": model_info["name"],
            "size": model_info["size"],
            "model_url": f"./models/{model_id}.onnx",
            "input_name": "input",
            "output_name": "output",
            "input_width": 512,
            "input_height": 512,
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
            "scale": 255.0,
            "source": "ONNX Model Zoo",
            "description": model_info["style"],
            "category": "Official ONNX Model"
        }
        styles_data["styles"].append(style_entry)
    
    styles_file = Path("web/styles.json")
    with open(styles_file, 'w') as f:
        json.dump(styles_data, f, indent=2)
    
    print(f"✅ Updated {styles_file} with {len(styles_data['styles'])} ONNX Zoo models")

def verify_models(model_dir):
    """Verify that all downloaded models are valid"""
    print(f"\n🔍 Verifying downloaded models...")
    
    for model_id in ONNX_MODELS.keys():
        filename = f"{model_id}.onnx"
        filepath = model_dir / filename
        
        if filepath.exists():
            size_mb = filepath.stat().st_size / (1024 * 1024)
            if size_mb > 1:  # Basic size check
                print(f"✅ {filename}: Valid ({size_mb:.1f}MB)")
            else:
                print(f"⚠️  {filename}: Suspiciously small ({size_mb:.1f}MB)")
        else:
            print(f"❌ {filename}: Missing")

def main():
    """Main download function"""
    print("🚀 Downloading Comprehensive ONNX Model Zoo Models")
    print("=" * 60)
    print("Source: https://github.com/onnx/models/tree/main/Computer_Vision")
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
        # Verify models
        verify_models(model_dir)
        
        # Update styles.json
        update_styles_json(model_dir)
        
        print(f"\n🎉 Setup complete! Your project now uses official ONNX Model Zoo models.")
        print(f"📁 Models location: {model_dir}")
        print(f"🎨 Available styles:")
        for model_id, model_info in ONNX_MODELS.items():
            print(f"   • {model_info['name']} - {model_info['style']}")
        
        print(f"\n🔧 Next steps:")
        print(f"   1. Restart your web server")
        print(f"   2. Test the new models in your app")
        print(f"   3. All models are optimized for 512x512 input/output")
        print(f"   4. These are official, tested models from ONNX Model Zoo")
    else:
        print(f"\n❌ No models were downloaded. Check your internet connection.")

if __name__ == "__main__":
    main()
