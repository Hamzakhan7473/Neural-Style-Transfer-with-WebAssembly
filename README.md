# Neural Style Transfer with WebAssembly

Turn your photos into art. This runs completely in your browser - no uploading to servers, no privacy issues. Just upload a photo, pick a style, and watch it transform.

## What This Actually Does

You know those AI art filters that make your photos look like Van Gogh or Picasso? This is that, but it runs entirely in your browser using WebAssembly. No sending your photos to random servers.

## Getting Started

You'll need:
- Rust (get the latest stable version)
- wasm-pack (for compiling Rust to WebAssembly)
- A decent browser (Chrome 113+, Firefox 110+, Safari 16.4+)

### Running It

```bash
# Get the code
git clone https://github.com/Hamzakhan7473/Neural-Style-Transfer-with-WebAssembly.git
cd Neural-Style-Transfer-with-WebAssembly

# Make the scripts work
chmod +x scripts/build.sh scripts/download_models.sh

# Build and run
./scripts/build.sh
```

This script does three things:
1. Compiles the Rust code to WebAssembly
2. Downloads the actual AI models (they're about 6.6MB each)
3. Starts a local server at http://localhost:8000

## The Styles

I grabbed these from the official ONNX model repository - they actually work:

1. **Mosaic** - Makes everything look like colorful tiles
2. **Candy** - Super bright, almost neon colors
3. **Rain Princess** - That dreamy, rainy day look
4. **Udnie** - Weird abstract art style
5. **Pointilism** - Classic dots-everywhere painting style

## How It Actually Works

### The JavaScript Side
- Uses ONNX Runtime Web to run the AI models
- WebAssembly does the heavy lifting for image processing
- You can adjust how strong the effect is
- Works offline after you load it once

### The Rust/WebAssembly Part
- I wrote the image processing stuff in Rust
- It compiles to WebAssembly for speed
- Handles resizing, color conversion, all that boring stuff

### The AI Models
- These are Fast Neural Style Transfer models from PyTorch
- Converted to ONNX format (which browsers can actually run)
- Takes 224×224 pixel images
- Spits out RGB images

## How Fast Is It?

- Takes 1-5 seconds on a decent computer
- Uses about 200MB of RAM for the big models
- WebGPU makes it 3-10x faster (if your browser supports it)
- Once you load it, it works offline

## The Technical Stuff

### How It's Built
```
Your Image → WebAssembly → AI Model → WebAssembly → Result
```

### What's In Here
```
neural-style-transfer/
├── Cargo.toml              # Rust stuff
├── src/lib.rs              # WebAssembly bindings
├── web/
│   ├── index.html          # The main page
│   ├── style.css           # Makes it look nice
│   ├── app.js              # The main JavaScript
│   ├── service-worker.js   # Offline magic
│   └── models/             # The AI models
├── scripts/download_models.sh      # Downloads models
└── scripts/build.sh               # Builds everything
```

### Browser Compatibility
- ✅ **Chrome 113+** (Everything works)
- ✅ **Edge 113+** (Everything works)
- ⚠️ **Firefox 110+** (WebGPU needs to be enabled)
- ⚠️ **Safari 16.4+** (WebGPU is experimental)

## How To Use It

### Single Image Processing
1. Upload a photo or use your webcam
2. Pick a style (it'll download the model automatically)
3. Slide the strength bar (0-100%)
4. Hit "Stylize" and wait a few seconds
5. Download your masterpiece as PNG

### Batch Processing (NEW!)
1. Click "Batch Process" to enable batch mode
2. Select multiple images (up to 10 at once)
3. Choose your style and strength
4. Hit "Start Batch" and watch the progress bar
5. Download all processed images at once

Perfect for processing photo collections or creating consistent art styles across multiple images!

## When Things Go Wrong

### Models won't download?
```bash
# Try downloading them manually
./scripts/download_models.sh
```

### WebAssembly not working?
- Make sure you're running it from a web server (not just opening the HTML file)
- Check the browser console for errors

### It's running slow?
- Turn on WebGPU in your browser settings
- Use smaller images (1024×1024 max)
- Close other tabs

### Running out of memory?
- Use smaller images
- Try a different style (some are lighter)
- Restart your browser

## Why This One Actually Works

Most tutorials I found were pretty useless:
- Fake ONNX models that don't do anything
- Old ONNX.js library that's basically dead
- Code that looks good but crashes when you try it
- Overly complicated TensorFlow.js stuff

This one actually works because:
- Real ONNX models from the official repository
- ONNX Runtime Web (the thing that actually works)
- I tested this stuff and it runs
- Simple code that you can actually understand

## What You Can Do Next

- Train your own style models with PyTorch
- Deploy this somewhere (the service worker makes it easy)
- Make it look like your brand
- Add video effects with webcam

## Useful Links

- [Official ONNX Models](https://github.com/onnx/models) - Where I got the models
- [ONNX Runtime Web Docs](https://onnxruntime.ai/docs/get-started/with-javascript.html) - How to use ONNX in browsers
- [PyTorch Style Transfer](https://github.com/pytorch/examples/tree/master/fast_neural_style) - Original implementation
- [Rust + WebAssembly](https://rustwasm.github.io/docs/book/) - How I built this

---

**This actually works and you can use it right now!**

## About

Turn photos into art using AI that runs in your browser. No servers, no privacy issues, just upload and transform. Built with Rust, WebAssembly, and WebGPU for speed.

### Resources

- [Readme](README.md)

### License

[MIT license](LICENSE)

### Security policy

[Security policy](SECURITY.md)

---

<div align="center">
  <strong>Made by Abu Hamza Khan</strong><br>
  <em>Because browser AI should be simple</em>
</div>