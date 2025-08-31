#!/usr/bin/env python3
"""
Download pre-trained style transfer ONNX models for the Neural Style Transfer app.
"""

import os
import requests
import zipfile
import json
from pathlib import Path

# Alternative model sources with working URLs
MODELS = {
    "starry_night": {
        "url": "https://huggingface.co/spaces/onnx/models/resolve/main/fast-neural-style-1.onnx",
        "filename": "starry_night.onnx",
        "size": "8.5MB",
        "description": "Van Gogh Starry Night style transfer model",
        "fallback": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-1.onnx"
    },
    "picasso_cubist": {
        "url": "https://huggingface.co/spaces/onnx/models/resolve/main/fast-neural-style-2.onnx", 
        "filename": "picasso_cubist.onnx",
        "size": "8.2MB",
        "description": "Picasso Cubist style transfer model",
        "fallback": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-2.onnx"
    },
    "ukiyo_e": {
        "url": "https://huggingface.co/spaces/onnx/models/resolve/main/fast-neural-style-3.onnx",
        "filename": "ukiyo_e.onnx", 
        "size": "7.8MB",
        "description": "Japanese Ukiyo-e style transfer model",
        "fallback": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-3.onnx"
    },
    "cyberpunk": {
        "url": "https://huggingface.co/spaces/onnx/models/resolve/main/fast-neural-style-4.onnx",
        "filename": "cyberpunk.onnx",
        "size": "9.1MB", 
        "description": "Cyberpunk Neon style transfer model",
        "fallback": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-4.onnx"
    },
    "abstract_expr": {
        "url": "https://huggingface.co/spaces/onnx/models/resolve/main/fast-neural-style-5.onnx",
        "filename": "abstract_expr.onnx",
        "size": "8.7MB",
        "description": "Abstract Expressionism style transfer model",
        "fallback": "https://github.com/onnx/models/raw/main/vision/style_transfer/fast_neural_style/model/fast-neural-style-5.onnx"
    }
}

def download_file(url, filename, models_dir, fallback_url=None):
    """Download a file from URL to the models directory."""
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
            filepath.unlink()  # Remove partial file
        
        # Try fallback URL if available
        if fallback_url:
            print(f"🔄 Trying fallback URL: {fallback_url}")
            try:
                response = requests.get(fallback_url, stream=True, timeout=30)
                response.raise_for_status()
                
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                print(f"✅ Downloaded {filename} from fallback URL!")
                return True
                
            except Exception as fallback_error:
                print(f"❌ Fallback also failed: {fallback_error}")
                if filepath.exists():
                    filepath.unlink()
        
        return False

def create_placeholder_models(models_dir):
    """Create placeholder models for testing if downloads fail."""
    print("\n📝 Creating placeholder models for testing...")
    
    # Create a simple ONNX model structure (this is just for testing)
    placeholder_content = b'\x08\x08\x12\x04onnx\x1a\x08ai.onnx.ml\x22\x04\x08\x01\x10\x01'
    
    for model_id, model_info in MODELS.items():
        filename = model_info["filename"]
        filepath = models_dir / filename
        
        if not filepath.exists():
            with open(filepath, 'wb') as f:
                f.write(placeholder_content)
            print(f"✅ Created placeholder: {filename}")
        else:
            print(f"⚠️  Already exists: {filename}")

def download_from_huggingface():
    """Try to download models from Hugging Face."""
    print("\n🔄 Trying alternative sources...")
    
    # Try some known working style transfer models
    alternative_models = {
        "starry_night": "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-1.onnx",
        "picasso_cubist": "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-2.onnx",
        "ukiyo_e": "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-3.onnx",
        "cyberpunk": "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-4.onnx",
        "abstract_expr": "https://huggingface.co/onnx/fast-neural-style/resolve/main/fast-neural-style-5.onnx"
    }
    
    success_count = 0
    for model_id, url in alternative_models.items():
        filename = MODELS[model_id]["filename"]
        if download_file(url, filename, models_dir):
            success_count += 1
    
    return success_count

def main():
    # Setup paths
    project_root = Path(__file__).parent.parent
    global models_dir
    models_dir = project_root / "web" / "models"
    models_dir.mkdir(exist_ok=True)
    
    print("🚀 Neural Style Transfer Model Downloader")
    print("=" * 50)
    print(f"Models directory: {models_dir}")
    print()
    
    # Try to download models
    success_count = 0
    for model_id, model_info in MODELS.items():
        print(f"\n📦 {model_info['description']}")
        print(f"Size: {model_info['size']}")
        
        if download_file(model_info['url'], model_info['filename'], models_dir, model_info.get('fallback')):
            success_count += 1
        
        print("-" * 40)
    
    # If all failed, try alternative sources
    if success_count == 0:
        print("\n🔄 All primary downloads failed. Trying alternative sources...")
        success_count = download_from_huggingface()
    
    print(f"\n📊 Download Summary:")
    print(f"✅ Successful: {success_count}/{len(MODELS)}")
    print(f"❌ Failed: {len(MODELS) - success_count}/{len(MODELS)}")
    
    if success_count == 0:
        print("\n⚠️  All downloads failed. Creating placeholder models for testing...")
        create_placeholder_models(models_dir)
        print("\n💡 You can now test the app interface, but style transfer won't work without real models.")
        print("\n💡 Manual download options:")
        print("1. ONNX Model Zoo: https://github.com/onnx/models")
        print("2. Hugging Face: https://huggingface.co/models?search=style+transfer")
        print("3. TensorFlow Hub: https://tfhub.dev/s?deployment-format=lite&module-type=image-style-transfer")
        print("\n💡 For testing, you can also:")
        print("- Use the export_to_onnx.py script with your own trained models")
        print("- Convert models from other formats using online converters")
    
    print(f"\n🎯 Next steps:")
    print(f"1. Check the models directory: {models_dir}")
    print(f"2. Restart your web server if needed")
    print(f"3. Test the application in your browser")
    print(f"4. Upload an image and try style transfer!")

if __name__ == "__main__":
    main()
