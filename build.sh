#!/bin/bash

# Neural Style Transfer - Rust + WebAssembly Build Script
# This script builds the Rust WebAssembly module and sets up the web application

set -e

echo "🎨 Building Neural Style Transfer (Rust + WebAssembly)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}📋 Checking dependencies...${NC}"
    
    if ! command -v rustc &> /dev/null; then
        echo -e "${RED}❌ Rust is not installed. Please install from https://rustup.rs/${NC}"
        exit 1
    fi
    
    if ! command -v wasm-pack &> /dev/null; then
        echo -e "${YELLOW}⚠️  wasm-pack not found. Installing...${NC}"
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    fi
    
    if ! command -v basic-http-server &> /dev/null; then
        echo -e "${YELLOW}⚠️  basic-http-server not found. Installing...${NC}"
        cargo install basic-http-server
    fi
    
    echo -e "${GREEN}✅ All dependencies available${NC}"
}

# Build WebAssembly module
build_wasm() {
    echo -e "${BLUE}🦀 Building Rust WebAssembly module...${NC}"
    
    # Build with optimizations
    wasm-pack build --target web --out-dir www/pkg --release
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ WebAssembly build successful${NC}"
    else
        echo -e "${RED}❌ WebAssembly build failed${NC}"
        exit 1
    fi
}

# Setup web assets
setup_web_assets() {
    echo -e "${BLUE}📁 Setting up web assets...${NC}"
    
    # Create necessary directories
    mkdir -p www/models
    mkdir -p www/icons
    mkdir -p www/screenshots
    mkdir -p www/previews
    
    # Create placeholder model files (you'll need to replace with actual ONNX models)
    create_placeholder_models
    
    # Generate icons
    generate_icons
    
    echo -e "${GREEN}✅ Web assets setup complete${NC}"
}

# Create placeholder ONNX model files
create_placeholder_models() {
    echo -e "${BLUE}📦 Creating placeholder model files...${NC}"
    
    # Note: These are placeholders - you need actual ONNX models
    # You can download pre-trained style transfer models from:
    # - TensorFlow Hub: https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2
    # - ONNX Model Zoo: https://github.com/onnx/models
    # - PyTorch Hub: https://pytorch.org/hub/pytorch_vision_alexnet/
    
    models=("vangogh-style.onnx" "picasso-style.onnx" "monet-style.onnx" "cyberpunk-style.onnx" "ukiyo-style.onnx")
    
    for model in "${models[@]}"; do
        if [ ! -f "www/models/$model" ]; then
            echo -e "${YELLOW}⚠️  Creating placeholder for $model${NC}"
            # Create a small placeholder file
            echo "PLACEHOLDER_ONNX_MODEL" > "www/models/$model"
            echo "   Replace with actual ONNX model file"
        fi
    done
    
    echo -e "${YELLOW}⚠️  IMPORTANT: Replace placeholder model files with actual ONNX models${NC}"
}

# Generate app icons using ImageMagick (if available)
generate_icons() {
    if command -v convert &> /dev/null; then
        echo -e "${BLUE}🖼️  Generating icons...${NC}"
        
        # Create a simple gradient icon as base
        convert -size 512x512 gradient:'#667eea'-'#764ba2' www/icons/base-icon.png
        
        # Generate different sizes
        sizes=(72 96 128 144 152 192 384 512)
        for size in "${sizes[@]}"; do
            convert www/icons/base-icon.png -resize ${size}x${size} www/icons/icon-${size}.png
        done
        
        echo -e "${GREEN}✅ Icons generated${NC}"
    else
        echo -e "${YELLOW}⚠️  ImageMagick not found. Skipping icon generation.${NC}"
        echo "   Install ImageMagick to auto-generate icons, or add them manually"
    fi
}

# Optimize build
optimize_build() {
    echo -e "${BLUE}⚡ Optimizing build...${NC}"
    
    # Optimize WebAssembly binary if wasm-opt is available
    if command -v wasm-opt &> /dev/null; then
        echo -e "${BLUE}   Optimizing WebAssembly binary...${NC}"
        wasm-opt -Oz -o www/pkg/neural_style_transfer_bg.wasm.opt www/pkg/neural_style_transfer_bg.wasm
        mv www/pkg/neural_style_transfer_bg.wasm.opt www/pkg/neural_style_transfer_bg.wasm
        echo -e "${GREEN}✅ WebAssembly optimization complete${NC}"
    fi
    
    # Compress CSS and JS if available
    if command -v terser &> /dev/null; then
        echo -e "${BLUE}   Minifying JavaScript...${NC}"
        terser www/app.js --compress --mangle -o www/app.min.js
        echo -e "${GREEN}✅ JavaScript minification complete${NC}"
    fi
}

# Development server
serve_dev() {
    echo -e "${BLUE}🌐 Starting development server...${NC}"
    echo -e "${GREEN}   Application will be available at: http://localhost:8000${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to stop the server${NC}"
    echo ""
    
    cd www && basic-http-server --addr 127.0.0.1:8000 .
}

# Production build
build_production() {
    echo -e "${BLUE}📦 Building for production...${NC}"
    
    # Build with release optimizations
    RUSTFLAGS="-C opt-level=s" wasm-pack build --target web --out-dir www/pkg --release
    
    # Additional optimizations
    optimize_build
    
    echo -e "${GREEN}✅ Production build complete${NC}"
    echo -e "${GREEN}   Files ready for deployment in ./www/ directory${NC}"
}

# Clean build artifacts
clean() {
    echo -e "${BLUE}🧹 Cleaning build artifacts...${NC}"
    
    rm -rf www/pkg
    rm -rf target
    rm -f www/app.min.js
    rm -rf www/models/*.onnx
    
    echo -e "${GREEN}✅ Clean complete${NC}"
}

# Main execution
case "${1:-build}" in
    "build")
        check_dependencies
        build_wasm
        setup_web_assets
        echo -e "${GREEN}🎉 Build complete! Run './build.sh serve' to start development server${NC}"
        ;;
    "serve")
        if [ ! -d "www/pkg" ]; then
            echo -e "${YELLOW}⚠️  WebAssembly module not found. Building first...${NC}"
            check_dependencies
            build_wasm
            setup_web_assets
        fi
        serve_dev
        ;;
    "production"|"prod")
        check_dependencies
        setup_web_assets
        build_production
        ;;
    "clean")
        clean
        ;;
    "deps")
        check_dependencies
        ;;
    "help"|"-h"|"--help")
        echo "Neural Style Transfer Build Script"
        echo ""
        echo "Usage: ./build.sh [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  build       Build WebAssembly module and setup assets (default)"
        echo "  serve       Start development server (builds if needed)"
        echo "  production  Build optimized version for production"
        echo "  clean       Remove build artifacts"
        echo "  deps        Check and install dependencies"
        echo "  help        Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./build.sh              # Build everything"
        echo "  ./build.sh serve        # Build and serve"
        echo "  ./build.sh production   # Production build"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Run './build.sh help' for usage information"
        exit 1
        ;;
esac
