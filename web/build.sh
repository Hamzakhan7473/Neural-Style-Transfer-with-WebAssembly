#!/bin/bash

# ================================
# Neural Style Transfer Build Script
# Handles Rust/WASM compilation, model downloading, and server startup
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

echo -e "${PURPLE}🎨 Neural Style Transfer Build Script${NC}"
echo "============================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Rust installation
check_rust() {
    if ! command_exists cargo; then
        echo -e "${RED}❌ Rust is not installed!${NC}"
        echo "Please install Rust from https://rustup.rs/"
        echo "Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        exit 1
    fi
    
    if ! command_exists wasm-pack; then
        echo -e "${YELLOW}⚠️  wasm-pack not found, installing...${NC}"
        cargo install wasm-pack
    fi
    
    echo -e "${GREEN}✅ Rust toolchain ready${NC}"
}

# Function to build WASM module
build_wasm() {
    echo -e "${BLUE}🔨 Building WebAssembly module...${NC}"
    echo "--------------------------------"
    
    # Go to rust-core directory
    cd ../rust-core
    
    # Clean previous build
    if [ -d "pkg" ]; then
        echo "Cleaning previous build..."
        rm -rf pkg
    fi
    
    # Build WASM module
    echo "Building with wasm-pack..."
    wasm-pack build --target web --out-dir ../web/pkg
    
    # Check if build was successful
    if [ -f "../web/pkg/neural_style_transfer.js" ]; then
        echo -e "${GREEN}✅ WASM module built successfully${NC}"
    else
        echo -e "${RED}❌ WASM build failed${NC}"
        exit 1
    fi
    
    cd ../web
}

# Function to download models
download_models() {
    echo -e "${BLUE}📥 Downloading style transfer models...${NC}"
    echo "----------------------------------------"
    
    if [ -f "download_models.sh" ]; then
        chmod +x download_models.sh
        ./download_models.sh
    else
        echo -e "${RED}❌ download_models.sh not found${NC}"
        exit 1
    fi
}

# Function to start development server
start_server() {
    echo -e "${BLUE}🚀 Starting development server...${NC}"
    echo "--------------------------------"
    
    # Check if port 8000 is available
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 8000 is already in use${NC}"
        echo "Please stop the existing server or use a different port"
        echo "You can kill the process with: lsof -ti:8000 | xargs kill -9"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Starting server on http://localhost:8000${NC}"
    echo -e "${CYAN}💡 Press Ctrl+C to stop the server${NC}"
    echo ""
    
    python3 -m http.server 8000
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  build     Build WASM module only"
    echo "  models    Download models only"
    echo "  serve     Start development server only"
    echo "  all       Build, download models, and start server (default)"
    echo "  clean     Clean build artifacts"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0          # Full build and start server"
    echo "  $0 build    # Build WASM only"
    echo "  $0 models   # Download models only"
    echo "  $0 serve    # Start server only"
}

# Function to clean build artifacts
clean_build() {
    echo -e "${BLUE}🧹 Cleaning build artifacts...${NC}"
    
    # Clean WASM build
    if [ -d "../rust-core/pkg" ]; then
        rm -rf ../rust-core/pkg
        echo "Cleaned rust-core/pkg"
    fi
    
    if [ -d "pkg" ]; then
        rm -rf pkg
        echo "Cleaned web/pkg"
    fi
    
    # Clean models (optional)
    if [ -d "models" ]; then
        echo -e "${YELLOW}⚠️  Models directory found. Remove models? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rm -rf models
            echo "Cleaned models directory"
        fi
    fi
    
    echo -e "${GREEN}✅ Clean complete${NC}"
}

# Main build process
main_build() {
    echo -e "${PURPLE}🚀 Starting full build process...${NC}"
    echo ""
    
    # Check prerequisites
    check_rust
    
    # Build WASM
    build_wasm
    
    # Download models
    download_models
    
    echo ""
    echo -e "${GREEN}🎉 Build complete!${NC}"
    echo -e "${CYAN}💡 Run '$0 serve' to start the development server${NC}"
}

# Parse command line arguments
case "${1:-all}" in
    "build")
        check_rust
        build_wasm
        echo -e "${GREEN}✅ Build complete!${NC}"
        ;;
    "models")
        download_models
        echo -e "${GREEN}✅ Models downloaded!${NC}"
        ;;
    "serve")
        start_server
        ;;
    "all")
        main_build
        start_server
        ;;
    "clean")
        clean_build
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        show_usage
        exit 1
        ;;
esac
