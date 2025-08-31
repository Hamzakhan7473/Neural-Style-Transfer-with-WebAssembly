#!/bin/bash

echo "🚀 Building Rust + WASM Neural Style Transfer (ONNX Runtime + WebGPU)"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Build the Rust WASM package
echo "🔨 Building Rust WASM package..."
cd crates/neural-style-transfer
wasm-pack build --release --target web

# Copy the generated pkg into the web app
echo "📁 Copying WASM package to web app..."
mkdir -p ../../web/pkg
cp -r pkg/* ../../web/pkg/

echo "✅ Build complete!"
echo ""
echo "To run the app:"
echo "  cd web"
echo "  python3 -m http.server 5173"
echo "  # Then open http://localhost:5173"
echo ""
echo "Or use any static server:"
echo "  cd web"
echo "  npx serve ."
echo "  # or"
echo "  npx vite"
