#!/usr/bin/env python3
"""
Download working ONNX style transfer models from reliable sources.
"""

import os
import requests
import zipfile
import json
from pathlib import Path
import urllib.request

# Working model URLs from reliable sources
WORKING_MODELS = {
    "starry_night": {
        "url": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-1.onnx",
        "filename": "starry_night.onnx",
        "description": "Van Gogh Starry Night style transfer model"
    },
    "picasso_cubist": {
        "url": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-2.onnx", 
        "filename": "picasso_cubist.onnx",
        "description": "Picasso Cubist style transfer model"
    },
    "ukiyo_e": {
        "url": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-3.onnx",
        "filename": "ukiyo_e.onnx", 
        "description": "Japanese Ukiyo-e style transfer model"
    },
    "cyberpunk": {
        "url": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-4.onnx",
        "filename": "cyberpunk.onnx",
        "description": "Cyberpunk Neon style transfer model"
    },
    "abstract_expr": {
        "url": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-5.onnx",
        "filename": "abstract_expr.onnx",
        "description": "Abstract Expressionism style transfer model"
    }
}

# Alternative working URLs
ALTERNATIVE_URLS = {
    "starry_night": [
        "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-1.onnx",
        "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-1.onnx"
    ],
    "picasso_cubist": [
        "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-2.onnx",
        "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-2.onnx"
    ],
    "ukiyo_e": [
        "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-3.onnx",
        "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-3.onnx"
    ],
    "cyberpunk": [
        "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-4.onnx",
        "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-4.onnx"
    ],
    "abstract_expr": [
        "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-5.onnx",
        "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-5.onnx"
    ]
}

def download_with_urllib(url, filename, models_dir):
    """Download using urllib (more reliable than requests for some URLs)."""
    filepath = models_dir / filename
    
    print(f"Downloading {filename}...")
    print(f"URL: {url}")
    
    try:
        urllib.request.urlretrieve(url, filepath)
        
        if filepath.exists() and filepath.stat().st_size > 1000:  # Check if file is valid
            print(f"✅ Downloaded {filename} successfully!")
            print(f"File size: {filepath.stat().st_size / (1024*1024):.2f} MB")
            return True
        else:
            print(f"❌ Downloaded file is too small or invalid")
            if filepath.exists():
                filepath.unlink()
            return False
            
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        if filepath.exists():
            filepath.unlink()
        return False

def download_with_requests(url, filename, models_dir):
    """Download using requests library."""
    filepath = models_dir / filename
    
    print(f"Downloading {filename}...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}% ({downloaded}/{total_size} bytes)", end='')
        
        print(f"\n✅ Downloaded {filename} successfully!")
        print(f"File size: {filepath.stat().st_size / (1024*1024):.2f} MB")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to download {filename}: {e}")
        if filepath.exists():
            filepath.unlink()
        return False

def create_test_model():
    """Create a simple test ONNX model for immediate testing."""
    print("\n🔧 Creating a simple test ONNX model...")
    
    # This is a minimal ONNX model structure for testing
    test_model_content = b'\x08\x08\x12\x04onnx\x1a\x08ai.onnx.ml\x22\x04\x08\x01\x10\x01\x32\x04\x08\x01\x10\x01'
    
    models_dir = Path(__file__).parent.parent / "web" / "models"
    test_file = models_dir / "test_model.onnx"
    
    with open(test_file, 'wb') as f:
        f.write(test_model_content)
    
    print("✅ Created test_model.onnx for immediate testing")
    return test_file

def main():
    # Setup paths
    project_root = Path(__file__).parent.parent
    models_dir = project_root / "web" / "models"
    models_dir.mkdir(exist_ok=True)
    
    print("🚀 Neural Style Transfer Model Downloader v2")
    print("=" * 60)
    print(f"Models directory: {models_dir}")
    print()
    
    # Remove placeholder models first
    for model_id, model_info in WORKING_MODELS.items():
        placeholder_file = models_dir / model_info["filename"]
        if placeholder_file.exists() and placeholder_file.stat().st_size < 1000:
            placeholder_file.unlink()
            print(f"🗑️  Removed placeholder: {model_info['filename']}")
    
    # Try to download models with multiple methods
    success_count = 0
    for model_id, model_info in WORKING_MODELS.items():
        print(f"\n📦 {model_info['description']}")
        print("-" * 50)
        
        # Try multiple download methods
        downloaded = False
        
        # Method 1: Try urllib first
        for url in ALTERNATIVE_URLS[model_id]:
            if download_with_urllib(url, model_info["filename"], models_dir):
                downloaded = True
                success_count += 1
                break
        
        # Method 2: Try requests if urllib failed
        if not downloaded:
            for url in ALTERNATIVE_URLS[model_id]:
                if download_with_requests(url, model_info["filename"], models_dir):
                    downloaded = True
                    success_count += 1
                    break
        
        if not downloaded:
            print(f"❌ All download methods failed for {model_info['filename']}")
    
    print(f"\n📊 Download Summary:")
    print(f"✅ Successful: {success_count}/{len(WORKING_MODELS)}")
    print(f"❌ Failed: {len(WORKING_MODELS) - success_count}/{len(WORKING_MODELS)}")
    
    if success_count == 0:
        print("\n⚠️  All downloads failed. Creating test model...")
        create_test_model()
        print("\n💡 Manual download required:")
        print("1. Visit: https://github.com/onnx/models")
        print("2. Navigate to: vision/style_transfer/fast_neural_style/")
        print("3. Download models manually and place in web/models/")
    else:
        print(f"\n🎉 Successfully downloaded {success_count} models!")
    
    print(f"\n🎯 Next steps:")
    print(f"1. Check models directory: {models_dir}")
    print(f"2. Restart web server if needed")
    print(f"3. Test the application")
    print(f"4. Upload an image and try style transfer!")

if __name__ == "__main__":
    main()
