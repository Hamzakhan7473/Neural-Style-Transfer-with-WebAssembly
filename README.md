# Rust + WASM WebGPU Style Transfer (WONNX)

> 100% client‑side, privacy‑preserving neural style transfer in your browser.

https://user-images.example/demo-screencap.gif (placeholder)

## Features
- WebGPU‑accelerated ONNX inference (WONNX) compiled to WebAssembly (Rust)
- Image upload → pick a style → instant stylized preview
- Style strength blending, Download PNG, Reset
- Model registry (3–5 styles), lazy‑loaded per selection
- Offline capable (Service Worker caches app + models after first load)
- Bonus: Webcam mode for live stylization

## Quick start
```bash
# 1) Build the Rust WASM package
cd crates/stylizer
wasm-pack build --release --target web

# 2) Copy the generated pkg into the web app
#    (or use `--out-dir ../../web/pkg` in wasm-pack)
mkdir -p ../../web/pkg
cp -r pkg/* ../../web/pkg/

# 3) Serve the web app (any static server works)
cd ../../web
python3 -m http.server 5173
# open http://localhost:5173
```

> Tip: You can also use `vite` or `serve` to host `web/` as static files.

## Project layout
```
.
├─ Cargo.toml                      # workspace
├─ crates/
│  └─ stylizer/                    # Rust → WASM (wonnx, web bindings)
│     ├─ Cargo.toml
│     └─ src/lib.rs
├─ tools/
│  └─ export_to_onnx.py            # (optional) TF → ONNX exporter helper
└─ web/                            # Static web app
   ├─ index.html
   ├─ main.js
   ├─ styles.json                  # model registry
   ├─ sw.js                        # service worker
   ├─ pkg/                         # wasm-pack output copied here
   └─ models/                      # place your .onnx models here
```

## Model registry & ONNX models
- Place your ONNX style‑transfer models in `web/models/`. Example entries are
  provided in `web/styles.json`. Update `model_url`, `input_name`, `output_name`,
  `input_width`, `input_height`, and normalization parameters as needed.
- Recommended input sizes: 256×256 to 512×512 for real‑time performance.

### Converting TensorFlow style nets to ONNX
If your model is in TensorFlow, you can export via **tf2onnx**. See `tools/export_to_onnx.py`.

## Browser support
- Requires a modern browser with **WebGPU**. (Chrome 113+, Edge 113+, Safari 17+)
- Falls back to WebGPU compatibility layer provided by wgpu in WASM build.

## License
MIT (replace as needed). You are responsible for respecting any model licenses.

