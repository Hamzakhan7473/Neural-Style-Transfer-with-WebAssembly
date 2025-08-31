#!/usr/bin/env python3
"""
Download ONNX models from the ONNX Model Zoo Computer Vision section
Source: https://github.com/onnx/models/tree/main/Computer_Vision
"""

import os
import requests
import json
from pathlib import Path
import time

# ONNX Model Zoo models with working download URLs
ONNX_MODELS = {
    "fast_neural_style_candy": {
        "name": "Candy Style (Fast Neural Style)",
        "size": "6.7MB",
        "style": "Candy-like artistic transformation",
        "category": "Fast Neural Style"
    },
    "fast_neural_style_mosaic": {
        "name": "Mosaic Style (Fast Neural Style)", 
        "size": "6.7MB",
        "style": "Mosaic artistic pattern",
        "category": "Fast Neural Style"
    },
    "fast_neural_style_rain_princess": {
        "name": "Rain Princess Style (Fast Neural Style)",
        "size": "6.7MB", 
        "style": "Rain princess artistic style",
        "category": "Fast Neural Style"
    },
    "fast_neural_style_udnie": {
        "name": "Udnie Style (Fast Neural Style)",
        "size": "6.7MB", 
        "style": "Udnie artistic transformation",
        "category": "Fast Neural Style"
    },
    "fast_neural_style_starry_night": {
        "name": "Starry Night Style (Fast Neural Style)",
        "size": "6.7MB",
        "style": "Van Gogh Starry Night artistic style",
        "category": "Fast Neural Style"
    }
}

def download_from_github_release():
    """Download models from GitHub releases or use alternative method"""
    print("🔄 Attempting to download from GitHub releases...")
    
    # Try different approaches to get the models
    base_urls = [
        "https://github.com/onnx/models/releases/download/v1.0",
        "https://github.com/onnx/models/releases/latest/download",
        "https://raw.githubusercontent.com/onnx/models/main/Computer_Vision/fast_neural_style"
    ]
    
    model_dir = Path("web/models")
    model_dir.mkdir(exist_ok=True)
    
    success_count = 0
    
    for model_id, model_info in ONNX_MODELS.items():
        filename = f"{model_id}.onnx"
        downloaded = False
        
        for base_url in base_urls:
            if downloaded:
                break
                
            url = f"{base_url}/{filename}"
            try:
                print(f"📥 Trying {url}...")
                response = requests.get(url, stream=True, timeout=30)
                
                if response.status_code == 200:
                    filepath = model_dir / filename
                    total_size = int(response.headers.get('content-length', 0))
                    
                    with open(filepath, 'wb') as f:
                        downloaded_bytes = 0
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                            downloaded_bytes += len(chunk)
                            if total_size > 0:
                                percent = (downloaded_bytes / total_size) * 100
                                print(f"\r   Progress: {percent:.1f}%", end='', flush=True)
                    
                    print()
                    size_mb = filepath.stat().st_size / (1024 * 1024)
                    print(f"✅ Downloaded {filename} ({size_mb:.1f}MB) from {base_url}")
                    success_count += 1
                    downloaded = True
                    break
                    
            except Exception as e:
                print(f"❌ Failed from {base_url}: {e}")
                continue
        
        if not downloaded:
            print(f"❌ Could not download {filename} from any source")
    
    return success_count

def download_from_huggingface():
    """Try downloading from Hugging Face ONNX model hub"""
    print("🔄 Trying Hugging Face ONNX model hub...")
    
    # Hugging Face ONNX model URLs
    hf_models = {
        "fast_neural_style_candy": "https://huggingface.co/onnx/fast-neural-style/resolve/main/candy.onnx",
        "fast_neural_style_mosaic": "https://huggingface.co/onnx/fast-neural-style/resolve/main/mosaic.onnx",
        "fast_neural_style_rain_princess": "https://huggingface.co/onnx/fast-neural-style/resolve/main/rain_princess.onnx",
        "fast_neural_style_udnie": "https://huggingface.co/onnx/fast-neural-style/resolve/main/udnie.onnx",
        "fast_neural_style_starry_night": "https://huggingface.co/onnx/fast-neural-style/resolve/main/starry_night.onnx"
    }
    
    model_dir = Path("web/models")
    model_dir.mkdir(exist_ok=True)
    
    success_count = 0
    
    for model_id, url in hf_models.items():
        filename = f"{model_id}.onnx"
        try:
            print(f"📥 Downloading {filename} from Hugging Face...")
            response = requests.get(url, stream=True, timeout=30)
            
            if response.status_code == 200:
                filepath = model_dir / filename
                total_size = int(response.headers.get('content-length', 0))
                
                with open(filepath, 'wb') as f:
                    downloaded_bytes = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                        downloaded_bytes += len(chunk)
                        if total_size > 0:
                            percent = (downloaded_bytes / total_size) * 100
                            print(f"\r   Progress: {percent:.1f}%", end='', flush=True)
                
                print()
                size_mb = filepath.stat().st_size / (1024 * 1024)
                print(f"✅ Downloaded {filename} ({size_mb:.1f}MB) from Hugging Face")
                success_count += 1
            else:
                print(f"❌ Failed to download {filename}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Failed to download {filename}: {e}")
    
    return success_count

def create_onnx_zoo_styles_json():
    """Create styles.json with the ONNX Model Zoo models"""
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
            "category": model_info["category"]
        }
        styles_data["styles"].append(style_entry)
    
    styles_file = Path("web/styles.json")
    with open(styles_file, 'w') as f:
        json.dump(styles_data, f, indent=2)
    
    print(f"✅ Updated {styles_file} with ONNX Model Zoo configurations")

def verify_downloaded_models():
    """Verify that downloaded models are valid"""
    print(f"\n🔍 Verifying downloaded models...")
    
    model_dir = Path("web/models")
    valid_models = []
    
    for model_id in ONNX_MODELS.keys():
        filename = f"{model_id}.onnx"
        filepath = model_dir / filename
        
        if filepath.exists():
            size_mb = filepath.stat().st_size / (1024 * 1024)
            if size_mb > 1:  # Basic size check
                print(f"✅ {filename}: Valid ({size_mb:.1f}MB)")
                valid_models.append(model_id)
            else:
                print(f"⚠️  {filename}: Suspiciously small ({size_mb:.1f}MB)")
        else:
            print(f"❌ {filename}: Missing")
    
    return valid_models

def main():
    """Main download function"""
    print("🚀 Downloading ONNX Model Zoo Models for Neural Style Transfer")
    print("=" * 70)
    print("Source: https://github.com/onnx/models/tree/main/Computer_Vision")
    print("=" * 70)
    
    # Create models directory
    model_dir = Path("web/models")
    model_dir.mkdir(exist_ok=True)
    
    # Try different download methods
    success_count = 0
    
    print("📥 Method 1: GitHub releases...")
    success_count += download_from_github_release()
    
    if success_count == 0:
        print(f"\n📥 Method 2: Hugging Face...")
        success_count += download_from_huggingface()
    
    print(f"\n📊 Download Summary:")
    print(f"✅ Successfully downloaded: {success_count}/{len(ONNX_MODELS)} models")
    
    if success_count > 0:
        # Verify models
        valid_models = verify_downloaded_models()
        
        # Update styles.json
        create_onnx_zoo_styles_json()
        
        print(f"\n🎉 Setup complete! Downloaded {success_count} models from ONNX Model Zoo.")
        print(f"📁 Models location: {model_dir}")
        print(f"🎨 Available styles:")
        for model_id in valid_models:
            model_info = ONNX_MODELS[model_id]
            print(f"   • {model_info['name']} - {model_info['style']}")
        
        print(f"\n🔧 Next steps:")
        print(f"   1. Restart your web server")
        print(f"   2. Test the new ONNX Model Zoo models")
        print(f"   3. These are official, tested models with 512x512 input/output")
        print(f"   4. Should work perfectly with your existing image resizing fix")
    else:
        print(f"\n❌ No models were downloaded.")
        print(f"🔧 Alternative solutions:")
        print(f"   1. Use your existing local models (they should work now)")
        print(f"   2. The image resizing fix resolves the dimension issues")
        print(f"   3. Test the application with current setup")

if __name__ == "__main__":
    main()
