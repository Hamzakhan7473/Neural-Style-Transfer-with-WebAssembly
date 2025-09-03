# 🎨 Enhanced Neural Style Transfer with WebAssembly

A high-performance, client-side neural style transfer application powered by Rust/WebAssembly and ONNX Runtime Web. Transform your images with 20+ artistic styles from classical masters to modern digital art.

## ✨ Features

- **20+ Artistic Styles**: From Van Gogh to Cyberpunk, including classical masters and modern digital art
- **Real-time Processing**: Client-side processing with WebGPU acceleration
- **Category Filters**: Organize styles by Classical, Modern, Experimental, Texture, and Historical
- **Drag & Drop**: Easy image upload with drag & drop support
- **Webcam Integration**: Capture images directly from your camera
- **Style Strength Control**: Adjust the intensity of style transfer
- **Model Caching**: Intelligent caching for faster subsequent loads
- **Offline Support**: Service worker for offline capabilities
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- **Rust** (for WASM compilation)
- **Python 3** (for development server)
- **Modern browser** with WebAssembly and WebGPU support

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Neural-Style-Transfer-with-WebAssembly/web
   ```

2. **Make scripts executable**:
   ```bash
   chmod +x build.sh download_models.sh
   ```

3. **Build and run** (downloads all models automatically):
   ```bash
   ./build.sh
   ```

   Or run individual steps:
   ```bash
   ./build.sh build    # Build WASM module only
   ./build.sh models   # Download models only
   ./build.sh serve    # Start server only
   ```

4. **Open your browser** and go to `http://localhost:8000`

## 🎭 Available Styles

### Classical Artists
- **Van Gogh - Starry Night**: Swirling brushstrokes and vibrant night sky
- **Picasso - Cubist Style**: Geometric fragmentation and multiple perspectives
- **Monet - Water Lilies**: Soft impressionist colors and light reflections
- **Kandinsky - Abstract Composition**: Bold abstract shapes and explosive colors
- **Leonardo da Vinci**: Renaissance master techniques and sfumato
- **Hokusai - Great Wave**: Traditional Japanese ukiyo-e woodblock prints
- **Munch - The Scream**: Expressionist anxiety and emotional intensity

### Modern & Experimental
- **Cyberpunk Neon**: Futuristic neon lights and digital aesthetics
- **Anime Illustration**: Japanese animation art style
- **Street Art Graffiti**: Urban street art and graffiti aesthetics
- **Digital Glitch Art**: Computer glitch and digital distortion effects

### Texture & Patterns
- **Classic Oil Painting**: Traditional oil painting brush techniques
- **Watercolor Wash**: Soft watercolor bleeding and transparency effects
- **Classical Mosaic**: Colorful geometric mosaic patterns

### Historical Styles
- **Gothic Dark Art**: Medieval gothic architecture and dark themes
- **Steampunk Mechanical**: Victorian-era industrial and mechanical aesthetics
- **Art Nouveau**: Flowing organic forms and decorative elements

### Official ONNX Models
- **Pop Art Candy**: Bright, vibrant candy-like colors
- **Rain Princess**: Dreamy impressionist rainy atmosphere
- **Udnie - Abstract**: Bold abstract expressionist forms
- **Neo-Impressionist Pointilism**: Classic pointillist painting technique

## 🛠️ Technical Architecture

### Frontend
- **HTML5/CSS3**: Modern, responsive interface
- **JavaScript (ES6+)**: Application logic and UI interactions
- **WebAssembly**: High-performance image processing in Rust
- **ONNX Runtime Web**: Neural network inference with WebGPU acceleration

### Backend (Client-side)
- **Rust**: Image preprocessing and postprocessing
- **WebAssembly**: Compiled Rust code for browser execution
- **ONNX Runtime**: Neural network inference engine

### Models
- **Fast Neural Style Transfer**: Optimized for real-time processing
- **ONNX Format**: Cross-platform model format
- **Multiple Sources**: Official ONNX repository, Hugging Face, community models

## 📁 Project Structure

```
web/
├── index.html              # Main application interface
├── app.js                  # Application logic
├── style.css              # Enhanced styling
├── build.sh               # Build script
├── download_models.sh     # Model downloader
├── service-worker.js      # Offline support
├── pkg/                   # Compiled WASM module
│   ├── neural_style_transfer.js
│   └── neural_style_transfer_bg.wasm
└── models/                # ONNX style transfer models
    ├── mosaic-9.onnx
    ├── candy-9.onnx
    ├── rain-princess-9.onnx
    └── ... (20+ models)
```

## 🎨 How to Use

1. **Upload an Image**:
   - Click the upload area or drag & drop an image
   - Use the webcam to capture a photo
   - Supported formats: JPEG, PNG, WebP

2. **Select a Style**:
   - Browse styles by category using the filter buttons
   - Click on any style to load it
   - Each style shows artist info, year, and recommended strength

3. **Adjust Settings**:
   - Use the style strength slider (0-100%)
   - Higher values = more stylized, lower values = more original

4. **Process & Download**:
   - Click "Stylize" to process your image
   - Wait for processing (usually 1-5 seconds)
   - Download your artistic creation

## 🔧 Development

### Building from Source

1. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install wasm-pack**:
   ```bash
   cargo install wasm-pack
   ```

3. **Build the project**:
   ```bash
   ./build.sh build
   ```

### Adding Custom Models

1. **Place ONNX files** in the `models/` directory
2. **Update the model registry** in `app.js`:
   ```javascript
   {
       name: 'your_style',
       displayName: 'Your Style Name',
       description: 'Description of the style',
       category: 'modern',
       url: './models/your-model.onnx',
       fileName: 'your-model.onnx',
       size: '6.5 MB',
       artist: 'Artist Name',
       year: 2024,
       recommended_strength: 0.8
   }
   ```

3. **Test with small images** first to ensure compatibility

### Model Requirements

- **Format**: ONNX (Open Neural Network Exchange)
- **Input**: RGB image tensor [1, 3, H, W] in range [0, 255]
- **Output**: RGB image tensor [1, 3, H, W] in range [0, 255]
- **Size**: 3-15MB recommended
- **Architecture**: Fast Neural Style Transfer compatible

## 🌐 Browser Compatibility

### Required Features
- **WebAssembly**: For Rust code execution
- **WebGPU** (optional): For GPU acceleration
- **ES6 Modules**: For JavaScript imports
- **File API**: For image upload
- **Canvas API**: For image processing

### Supported Browsers
- **Chrome 113+**: Full support with WebGPU
- **Firefox 110+**: Full support with WebGPU
- **Safari 16.4+**: Full support (WebGPU in development)
- **Edge 113+**: Full support with WebGPU

### Fallback Support
- **CPU-only processing**: When WebGPU is not available
- **Progressive enhancement**: Works on older browsers with reduced features

## 🚀 Performance

### Optimization Features
- **WebGPU acceleration**: 5-10x faster than CPU-only
- **Model caching**: Avoids re-downloading models
- **Image optimization**: Automatic resizing for processing
- **Memory management**: Efficient WASM memory usage

### Performance Tips
- **Use smaller images** for faster processing
- **Enable WebGPU** for best performance
- **Close other tabs** to free up GPU memory
- **Use SSD storage** for faster model loading

## 🔒 Privacy & Security

### Client-side Processing
- **No server upload**: All processing happens in your browser
- **No data collection**: Images never leave your device
- **Local storage**: Models cached locally for offline use

### Security Features
- **Content Security Policy**: Prevents XSS attacks
- **Sandboxed execution**: WASM runs in secure environment
- **Input validation**: Sanitizes all user inputs

## 🐛 Troubleshooting

### Common Issues

**"WASM module not found"**
- Run `./build.sh build` to rebuild the WASM module
- Check that `pkg/` directory exists and contains files

**"Models not loading"**
- Run `./build.sh models` to download models
- Check internet connection
- Verify models directory exists

**"WebGPU not available"**
- Update to latest browser version
- Enable WebGPU in browser flags
- App will fall back to CPU processing

**"Port 8000 in use"**
- Stop existing server: `lsof -ti:8000 | xargs kill -9`
- Or use different port: `python3 -m http.server 8001`

### Debug Tools

- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor model downloads
- **Performance Tab**: Analyze processing times
- **Debug Pages**: Use `debug.html` and `simple_test.html` for testing

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Areas for Contribution
- **New artistic styles**: Add more ONNX models
- **UI improvements**: Enhance the interface
- **Performance optimization**: Speed up processing
- **Browser compatibility**: Support more browsers
- **Documentation**: Improve guides and examples

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **ONNX Model Zoo**: Official neural style transfer models
- **Hugging Face**: Community model hosting
- **Rust WebAssembly**: High-performance client-side processing
- **ONNX Runtime**: Cross-platform inference engine
- **Fast Neural Style Transfer**: Original research and implementation

## 📞 Support

- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check the docs folder for detailed guides

---

**Made with ❤️ using Rust, WebAssembly, and ONNX Runtime**
