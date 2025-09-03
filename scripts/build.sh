#!/bin/bash

set -e

echo "🎨 Building Neural Style Transfer App"
echo "====================================="

# Check dependencies
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

echo "🦀 Building WebAssembly module..."
cd rust-core
wasm-pack build --target web --out-dir ../web/pkg --release
cd ..

echo "📦 Downloading ONNX models..."
chmod +x scripts/download_models.sh
./scripts/download_models.sh

echo "🌐 Starting development server..."
cd web

if command -v python3 &> /dev/null; then
    echo "Server running at: http://localhost:8080"
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Server running at: http://localhost:8080"
    python -m http.server 8080
else
    echo "Please serve the web/ directory with a web server"
    echo "Example: cd web && python3 -m http.server 8080"
fi
