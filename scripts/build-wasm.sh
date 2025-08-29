#!/bin/bash

echo "🚀 Building Rust Neural Style Transfer Engine for WebAssembly..."

# Navigate to rust-core directory
cd rust-core

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    cargo install wasm-pack
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean

# Build for web target
echo "🔨 Building for web target..."
wasm-pack build --target web --out-dir ../web-app/public/wasm

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ WebAssembly build successful!"
    echo "📁 Output files:"
    ls -la ../web-app/public/wasm/
    
    # Copy to web-app public directory
    echo "📋 Copying files to web-app..."
    cp -r ../web-app/public/wasm/* ../web-app/public/
    
    echo "🎉 Build complete! WebAssembly files are ready in web-app/public/"
else
    echo "❌ WebAssembly build failed!"
    exit 1
fi
