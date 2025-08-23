# Neural Style Transfer with WebAssembly

A high-performance neural style transfer web application that runs entirely in the browser using Rust, WebAssembly, and WebGPU. Transform your images with AI-powered artistic styles like Van Gogh, Picasso, Cyberpunk, and more - all with zero server costs and complete privacy.

## 🚀 Features

- **🖼️ Image Style Transfer**: Apply 5 different artistic styles to your photos
- **⚡ WebGPU Acceleration**: Hardware-accelerated inference using WebGPU
- **🔒 Privacy First**: All processing happens locally in your browser
- **📱 Progressive Web App**: Works offline after first load
- **🎥 Real-time Webcam**: Live style transfer with webcam input
- **🎛️ Style Controls**: Adjustable style strength and blending
- **📥 Download Support**: Save your stylized images as PNG files
- **🌐 Cross-platform**: Works on desktop and mobile browsers

## 🎨 Available Styles

1. **Van Gogh Starry Night** - Classic impressionist style
2. **Picasso Cubist** - Geometric abstract art
3. **Cyberpunk Neon** - Futuristic neon aesthetic
4. **Watercolor** - Soft, flowing watercolor painting
5. **Oil Painting** - Rich, textured oil painting style

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Rust + WebAssembly
- **Graphics**: WebGPU for hardware acceleration
- **AI Models**: ONNX format neural networks
- **Offline Support**: Service Worker + Cache API
- **Styling**: Modern CSS with responsive design

## 📋 Prerequisites

- **Rust** (latest stable version)
- **Node.js** (v16 or higher)
- **wasm-pack** (`cargo install wasm-pack`)
- **Modern browser** with WebGPU support (Chrome Canary, Firefox Nightly)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Neural-Style-Transfer-with-WebAssembly.git
cd Neural-Style-Transfer-with-WebAssembly
```

### 2. Build the Rust WebAssembly Module

```bash
cd rust-core
wasm-pack build --target web --out-dir ../web-app/public/wasm
cd ..
```

### 3. Install Web App Dependencies

```bash
cd web-app
npm install
```

### 4. Start the Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## 🏗️ Project Structure

```
Neural-Style-Transfer-with-WebAssembly/
├── rust-core/                 # Rust WebAssembly core
│   ├── src/
│   │   ├── engine.rs         # Style transfer engine
│   │   ├── gpu/              # WebGPU integration
│   │   ├── models/           # ONNX model handling
│   │   └── utils/            # Utility functions
│   └── Cargo.toml
├── web-app/                   # React web application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/               # Static assets
│   └── package.json
├── models/                    # ONNX model files
├── docs/                      # Documentation
└── README.md
```

## 🔧 Configuration

### WebGPU Settings

The app automatically detects WebGPU support and falls back gracefully if not available. For optimal performance:

- Use Chrome Canary with `--enable-unsafe-webgpu` flag
- Enable WebGPU in Firefox Nightly
- Ensure your GPU drivers are up to date

### Model Configuration

Style models are configured in `rust-core/src/models/mod.rs`. Each model includes:

- Input/output tensor specifications
- Recommended image resolution
- Model size and metadata
- Preview image paths

## 📱 Progressive Web App Features

- **Offline Support**: Works without internet after first load
- **Installable**: Add to home screen on mobile devices
- **Background Sync**: Processes images even when app is closed
- **Push Notifications**: Get notified when processing completes

## 🎯 Usage Guide

### Basic Style Transfer

1. **Upload Image**: Drag and drop or click to select an image
2. **Choose Style**: Select from available artistic styles
3. **Adjust Strength**: Use the slider to control style intensity
4. **Apply Transfer**: Click "Apply Style Transfer" to process
5. **Download Result**: Save your stylized image as PNG

### Webcam Mode

1. **Switch to Webcam**: Click "Switch to Webcam Mode"
2. **Start Camera**: Allow camera access and click "Start Webcam"
3. **Real-time Processing**: See live style transfer at 30 FPS
4. **Adjust Settings**: Modify style strength in real-time

### Advanced Features

- **Style Blending**: Mix original and stylized images
- **Resolution Control**: Optimize for different image sizes
- **Batch Processing**: Process multiple images sequentially
- **Quality Settings**: Choose between speed and quality

## 🔍 Troubleshooting

### Common Issues

**WebGPU Not Available**
- Update to latest browser version
- Enable experimental WebGPU features
- Check GPU driver compatibility

**WASM Loading Failed**
- Ensure wasm-pack is installed
- Rebuild the Rust module
- Check browser console for errors

**Performance Issues**
- Use smaller image resolutions
- Enable hardware acceleration
- Close other GPU-intensive applications

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- **Rust**: Follow rustfmt and clippy guidelines
- **TypeScript**: Use ESLint and Prettier
- **CSS**: Follow BEM methodology
- **Commits**: Use conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ONNX Runtime** for model inference
- **WebGPU Working Group** for the graphics API
- **Rust WebAssembly** community for tooling
- **React Team** for the frontend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/Neural-Style-Transfer-with-WebAssembly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Neural-Style-Transfer-with-WebAssembly/discussions)
- **Wiki**: [Project Wiki](https://github.com/yourusername/Neural-Style-Transfer-with-WebAssembly/wiki)

## 🔮 Roadmap

- [ ] Additional style models
- [ ] Video style transfer
- [ ] Custom style training
- [ ] Mobile app versions
- [ ] Cloud model hosting
- [ ] Social sharing features

---

**Made with ❤️ using Rust, WebAssembly, and WebGPU**

