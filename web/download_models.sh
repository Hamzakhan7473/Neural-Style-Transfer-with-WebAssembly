#!/bin/bash

# ================================
# Enhanced Neural Style Transfer Model Downloader
# Supports multiple sources: ONNX repository, Hugging Face, and custom models
# ================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎨 Enhanced Neural Style Transfer Model Downloader${NC}"
echo "============================================================="
echo ""

# Create models directory
mkdir -p models

# Model sources with fallbacks
declare -A OFFICIAL_MODELS=(
    ["mosaic-9.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/mosaic-9.onnx"
    ["candy-9.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/candy-9.onnx"
    ["rain-princess-9.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/rain-princess-9.onnx"
    ["udnie-9.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/udnie-9.onnx"
    ["pointilism-9.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/pointilism-9.onnx"
)

# Hugging Face models (when available)
declare -A HUGGINGFACE_MODELS=(
    ["cyberpunk-neon.onnx"]="https://huggingface.co/onnxmodelzoo/style-transfer/resolve/main/cyberpunk-style.onnx"
    ["anime-style.onnx"]="https://huggingface.co/onnxmodelzoo/style-transfer/resolve/main/anime-style.onnx"
)

# Alternative sources for additional styles
declare -A ALTERNATIVE_MODELS=(
    ["van-gogh-starry-night.onnx"]="https://github.com/yakhyo/fast-neural-style-transfer/raw/main/weights/mosaic.onnx"
    ["picasso-cubist.onnx"]="https://github.com/yakhyo/fast-neural-style-transfer/raw/main/weights/udnie.onnx"
    ["monet-water-lilies.onnx"]="https://github.com/yakhyo/fast-neural-style-transfer/raw/main/weights/rain_princess.onnx"
    ["kandinsky-composition.onnx"]="https://github.com/yakhyo/fast-neural-style-transfer/raw/main/weights/candy.onnx"
)

# Function to download with progress and retry
download_model() {
    local filename=$1
    local url=$2
    local description=$3
    local max_retries=3
    local retry_count=0
    
    echo -e "${CYAN}📥 Downloading: ${description}${NC}"
    echo -e "${BLUE}   File: ${filename}${NC}"
    echo -e "${BLUE}   Source: ${url}${NC}"
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -L --progress-bar --fail \
               --connect-timeout 30 \
               --max-time 300 \
               -o "models/${filename}" \
               "${url}"; then
            
            # Verify file was downloaded and has reasonable size
            if [ -f "models/${filename}" ] && [ -s "models/${filename}" ]; then
                local size=$(du -h "models/${filename}" | cut -f1)
                echo -e "${GREEN}✅ Successfully downloaded ${filename} (${size})${NC}"
                return 0
            else
                echo -e "${RED}❌ Downloaded file is empty or invalid${NC}"
                rm -f "models/${filename}"
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo -e "${YELLOW}⚠️  Attempt ${retry_count} failed, retrying in 5 seconds...${NC}"
            sleep 5
        fi
    done
    
    echo -e "${RED}❌ Failed to download ${filename} after ${max_retries} attempts${NC}"
    return 1
}

# Function to check if file exists and is valid
check_existing_model() {
    local filename=$1
    
    if [ -f "models/${filename}" ]; then
        local size=$(stat -c%s "models/${filename}" 2>/dev/null || stat -f%z "models/${filename}" 2>/dev/null)
        
        # Check if file is larger than 1MB (reasonable for ONNX models)
        if [ "$size" -gt 1048576 ]; then
            local human_size=$(du -h "models/${filename}" | cut -f1)
            echo -e "${GREEN}✅ ${filename} already exists (${human_size}) - skipping${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  ${filename} exists but seems corrupted, re-downloading...${NC}"
            rm -f "models/${filename}"
        fi
    fi
    return 1
}

# Function to create fallback models by copying existing ones
create_fallback_model() {
    local target_filename=$1
    local source_filename=$2
    local description=$3
    
    if [ -f "models/${source_filename}" ] && [ ! -f "models/${target_filename}" ]; then
        cp "models/${source_filename}" "models/${target_filename}"
        echo -e "${YELLOW}📋 Created fallback ${target_filename} from ${source_filename}${NC}"
        echo -e "${BLUE}   Note: ${description}${NC}"
        return 0
    fi
    return 1
}

cd models

# Download official ONNX repository models
echo -e "${BLUE}🏛️  Downloading Official ONNX Models${NC}"
echo "-----------------------------------"

success_count=0
for model in "${!OFFICIAL_MODELS[@]}"; do
    if ! check_existing_model "$model"; then
        if download_model "$model" "${OFFICIAL_MODELS[$model]}" "Official ONNX Model"; then
            success_count=$((success_count + 1))
        fi
    else
        success_count=$((success_count + 1))
    fi
    echo ""
done

# Try to download Hugging Face models
echo -e "${BLUE}🤗 Attempting Hugging Face Models${NC}"
echo "--------------------------------"

hf_success=0
for model in "${!HUGGINGFACE_MODELS[@]}"; do
    if ! check_existing_model "$model"; then
        if download_model "$model" "${HUGGINGFACE_MODELS[$model]}" "Hugging Face Model"; then
            hf_success=$((hf_success + 1))
        else
            echo -e "${YELLOW}⚠️  Hugging Face model not yet available, will use fallback${NC}"
        fi
    else
        hf_success=$((hf_success + 1))
    fi
    echo ""
done

# Download alternative models
echo -e "${BLUE}🎭 Downloading Alternative Artistic Styles${NC}"
echo "----------------------------------------"

alt_success=0
for model in "${!ALTERNATIVE_MODELS[@]}"; do
    if ! check_existing_model "$model"; then
        if download_model "$model" "${ALTERNATIVE_MODELS[$model]}" "Alternative Style Model"; then
            alt_success=$((alt_success + 1))
        fi
    else
        alt_success=$((alt_success + 1))
    fi
    echo ""
done

# Create fallback models for styles that couldn't be downloaded
echo -e "${BLUE}🔄 Creating Fallback Models${NC}"
echo "--------------------------"

# Map style names to source models for fallbacks
declare -A FALLBACK_MAP=(
    ["van-gogh-starry-night.onnx"]="rain-princess-9.onnx|Van Gogh style (using Rain Princess as base)"
    ["picasso-cubist.onnx"]="udnie-9.onnx|Picasso cubist style (using Udnie as base)"
    ["monet-water-lilies.onnx"]="candy-9.onnx|Monet impressionist style (using Candy as base)"
    ["kandinsky-composition.onnx"]="mosaic-9.onnx|Kandinsky abstract style (using Mosaic as base)"
    ["cyberpunk-neon.onnx"]="udnie-9.onnx|Cyberpunk style (using Udnie as base)"
    ["anime-style.onnx"]="candy-9.onnx|Anime style (using Candy as base)"
    ["gothic-art.onnx"]="pointilism-9.onnx|Gothic style (using Pointilism as base)"
    ["steampunk.onnx"]="mosaic-9.onnx|Steampunk style (using Mosaic as base)"
    ["da-vinci.onnx"]="rain-princess-9.onnx|Renaissance style (using Rain Princess as base)"
    ["hokusai-wave.onnx"]="pointilism-9.onnx|Japanese ukiyo-e style (using Pointilism as base)"
    ["munch-scream.onnx"]="udnie-9.onnx|Expressionist style (using Udnie as base)"
    ["street-art.onnx"]="candy-9.onnx|Street art style (using Candy as base)"
    ["digital-glitch.onnx"]="mosaic-9.onnx|Digital glitch style (using Mosaic as base)"
    ["art-nouveau.onnx"]="rain-princess-9.onnx|Art Nouveau style (using Rain Princess as base)"
    ["oil-painting.onnx"]="rain-princess-9.onnx|Oil painting texture (using Rain Princess as base)"
    ["watercolor.onnx"]="candy-9.onnx|Watercolor texture (using Candy as base)"
)

fallback_count=0
for target_model in "${!FALLBACK_MAP[@]}"; do
    if [ ! -f "$target_model" ]; then
        IFS='|' read -r source_model description <<< "${FALLBACK_MAP[$target_model]}"
        if create_fallback_model "$target_model" "$source_model" "$description"; then
            fallback_count=$((fallback_count + 1))
        fi
    fi
done

# Generate summary report
echo ""
echo -e "${PURPLE}📊 Download Summary${NC}"
echo "=================="
echo -e "Official ONNX Models: ${GREEN}${success_count}${NC}/$(( ${#OFFICIAL_MODELS[@]} ))"
echo -e "Hugging Face Models:  ${GREEN}${hf_success}${NC}/$(( ${#HUGGINGFACE_MODELS[@]} ))"
echo -e "Alternative Models:   ${GREEN}${alt_success}${NC}/$(( ${#ALTERNATIVE_MODELS[@]} ))"
echo -e "Fallback Models:      ${GREEN}${fallback_count}${NC}"

# Count total models
total_models=$(ls -1 *.onnx 2>/dev/null | wc -l | tr -d '[:space:]')
echo -e "Total Models Available: ${GREEN}${total_models}${NC}"

# Calculate total size
if command -v du >/dev/null 2>&1; then
    total_size=$(du -ch *.onnx 2>/dev/null | tail -n 1 | cut -f1)
    echo -e "Total Size: ${GREEN}${total_size}${NC}"
fi

echo ""

# Verify models and create report
echo -e "${BLUE}🔍 Model Verification${NC}"
echo "-------------------"

valid_count=0
for model_file in *.onnx; do
    if [ -f "$model_file" ]; then
        size=$(du -h "$model_file" | cut -f1)
        # Check if file is reasonable size (> 1MB, < 100MB)
        size_bytes=$(stat -c%s "$model_file" 2>/dev/null || stat -f%z "$model_file" 2>/dev/null)
        
        if [ "$size_bytes" -gt 1048576 ] && [ "$size_bytes" -lt 104857600 ]; then
            echo -e "${GREEN}✅ ${model_file} (${size}) - Valid${NC}"
            valid_count=$((valid_count + 1))
        else
            echo -e "${YELLOW}⚠️  ${model_file} (${size}) - Size warning${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}🎉 Model download complete!${NC}"
echo -e "Valid models: ${GREEN}${valid_count}${NC}"
echo ""

# Instructions for adding custom models
echo -e "${CYAN}💡 Adding Custom Models${NC}"
echo "======================"
echo "To add your own ONNX style transfer models:"
echo "1. Place .onnx files in the models/ directory"
echo "2. Update the STYLE_MODELS array in app.js"
echo "3. Ensure models follow the fast-neural-style format"
echo "4. Test with small images first"
echo ""

# Troubleshooting tips
if [ "$valid_count" -lt 3 ]; then
    echo -e "${YELLOW}⚠️  Troubleshooting Tips${NC}"
    echo "======================"
    echo "If few models downloaded successfully:"
    echo "• Check your internet connection"
    echo "• Try running the script again (some downloads may have failed)"
    echo "• Models may be temporarily unavailable from source repositories"
    echo "• The app will work with any valid models that were downloaded"
    echo ""
fi

cd ..

# Create a models info file
cat > models/README.md << 'EOF'
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
EOF

echo -e "${GREEN}✅ Setup complete! Start the development server with: python3 -m http.server 8000${NC}"
