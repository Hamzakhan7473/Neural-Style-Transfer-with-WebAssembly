#!/bin/bash

# Neural Style Transfer Build Script
# This script builds both the Rust WebAssembly module and the React web app

set -e  # Exit on any error

echo "🚀 Building Neural Style Transfer Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        print_error "Rust is not installed. Please install Rust first: https://rustup.rs/"
        exit 1
    fi
    
    # Check wasm-pack
    if ! command -v wasm-pack &> /dev/null; then
        print_warning "wasm-pack is not installed. Installing now..."
        cargo install wasm-pack
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Build Rust WebAssembly module
build_rust_wasm() {
    print_status "Building Rust WebAssembly module..."
    
    cd rust-core
    
    # Clean previous builds
    if [ -d "target" ]; then
        print_status "Cleaning previous build..."
        cargo clean
    fi
    
    # Build for web target
    print_status "Building with wasm-pack..."
    wasm-pack build --target web --out-dir ../web-app/public/wasm
    
    if [ $? -eq 0 ]; then
        print_success "Rust WASM module built successfully"
    else
        print_error "Failed to build Rust WASM module"
        exit 1
    fi
    
    cd ..
}

# Install web app dependencies
install_web_deps() {
    print_status "Installing web app dependencies..."
    
    cd web-app
    
    if [ -d "node_modules" ]; then
        print_status "Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        print_status "Removing package-lock.json..."
        rm package-lock.json
    fi
    
    print_status "Installing dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Web app dependencies installed successfully"
    else
        print_error "Failed to install web app dependencies"
        exit 1
    fi
    
    cd ..
}

# Build web app for production
build_web_app() {
    print_status "Building web app for production..."
    
    cd web-app
    
    print_status "Running production build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Web app built successfully"
    else
        print_error "Failed to build web app"
        exit 1
    fi
    
    cd ..
}

# Copy WASM files to build directory
copy_wasm_files() {
    print_status "Copying WASM files to build directory..."
    
    if [ ! -d "web-app/build/wasm" ]; then
        mkdir -p web-app/build/wasm
    fi
    
    cp web-app/public/wasm/* web-app/build/wasm/
    print_success "WASM files copied to build directory"
}

# Create production package
create_production_package() {
    print_status "Creating production package..."
    
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    mkdir dist
    cp -r web-app/build/* dist/
    
    # Create a simple server script
    cat > dist/server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
EOF

    # Create package.json for the production server
    cat > dist/package.json << 'EOF'
{
  "name": "neural-style-transfer-production",
  "version": "1.0.0",
  "description": "Production build of Neural Style Transfer app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

    print_success "Production package created in 'dist' directory"
}

# Main build process
main() {
    print_status "Starting build process..."
    
    # Check dependencies
    check_dependencies
    
    # Build Rust WASM
    build_rust_wasm
    
    # Install web dependencies
    install_web_deps
    
    # Build web app
    build_web_app
    
    # Copy WASM files
    copy_wasm_files
    
    # Create production package
    create_production_package
    
    print_success "🎉 Build completed successfully!"
    print_status "Production files are in the 'dist' directory"
    print_status "To run the production server:"
    echo "  cd dist"
    echo "  npm install"
    echo "  npm start"
}

# Run main function
main "$@"
