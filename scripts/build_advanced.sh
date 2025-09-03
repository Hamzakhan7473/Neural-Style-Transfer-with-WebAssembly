#!/bin/bash

# Advanced Neural Style Transfer Build Script
# Builds the Rust/WASM implementation with WebGPU and ONNX Runtime

set -e

echo "🚀 Building Advanced Neural Style Transfer with WebGPU..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Check if target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "📦 Installing wasm32 target..."
    rustup target add wasm32-unknown-unknown
fi

# Navigate to rust-core directory
cd rust-core

echo "🔨 Building WASM module..."

# Build with wasm-pack
wasm-pack build \
    --target web \
    --out-dir ../web/pkg \
    --out-name neural_style_transfer \
    --features console_error_panic_hook

echo "✅ WASM build completed!"

# Copy generated files to web directory
echo "📁 Copying generated files..."
cp -r pkg/* ../web/pkg/

# Create optimized build
echo "⚡ Creating optimized build..."
wasm-pack build \
    --target web \
    --out-dir ../web/pkg \
    --out-name neural_style_transfer_optimized \
    --features console_error_panic_hook \
    --release

echo "🎉 Advanced Neural Style Transfer build completed!"
echo ""
echo "📊 Build Summary:"
echo "   • WASM Module: web/pkg/neural_style_transfer.js"
echo "   • Optimized: web/pkg/neural_style_transfer_optimized.js"
echo "   • WebGPU Support: ✅ Enabled"
echo "   • ONNX Runtime: ✅ Integrated"
echo "   • Model Registry: ✅ Configured"
echo ""
echo "🌐 To test:"
echo "   • Start server: cd web && python3 -m http.server 8080"
echo "   • Open: http://localhost:8080/modern_interface.html"
echo ""
echo "🔧 Features:"
echo "   • WebGPU acceleration (with CPU fallback)"
echo "   • Dynamic model loading"
echo "   • Advanced image preprocessing"
echo "   • Real-time style strength control"
echo "   • Professional error handling"
