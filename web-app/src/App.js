import React, { useState, useRef, useCallback } from 'react';
import { useRustWasmEngine } from './hooks/useRustWasmEngine';
import './App.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [stylizedImage, setStylizedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [styleStrength, setStyleStrength] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableStyles, setAvailableStyles] = useState([]);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Use the Rust WebAssembly engine
  const {
    isLoading: wasmLoading,
    isInitialized: wasmInitialized,
    progress: wasmProgress,
    error: wasmError,
    applyStyleTransfer,
    getAvailableStyles,
  } = useRustWasmEngine();

  // Load available styles when WASM is initialized
  React.useEffect(() => {
    const loadStyles = async () => {
      if (wasmInitialized) {
        try {
          const styles = await getAvailableStyles();
          setAvailableStyles(styles);
          console.log('Available styles loaded:', styles);
        } catch (err) {
          console.error('Failed to load styles:', err);
        }
      }
    };
    
    loadStyles();
  }, [wasmInitialized, getAvailableStyles]);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setStylizedImage(null);
        setSelectedStyle('');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleStyleTransfer = useCallback(async () => {
    if (!selectedImage || !selectedStyle) {
      alert('Please select an image and style first');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Apply style transfer using Rust WASM engine
      const result = await applyStyleTransfer(selectedImage, selectedStyle, styleStrength);
      
      if (result) {
        // Convert ImageData to canvas and get data URL
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = result.width;
        canvas.height = result.height;
        ctx.putImageData(result, 0, 0);
        
        const stylizedDataUrl = canvas.toDataURL('image/png');
        setStylizedImage(stylizedDataUrl);
      }
      
    } catch (err) {
      console.error('Style transfer failed:', err);
      alert(`Style transfer failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, selectedStyle, styleStrength, applyStyleTransfer]);

  const handleDownload = useCallback(() => {
    if (stylizedImage) {
      const link = document.createElement('a');
      link.download = `stylized-${selectedStyle}.png`;
      link.href = stylizedImage;
      link.click();
    }
  }, [stylizedImage, selectedStyle]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setStylizedImage(null);
    setSelectedStyle('');
    setStyleStrength(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleStyleSelect = useCallback((style) => {
    setSelectedStyle(style);
  }, []);

  if (wasmLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="neural-grid"></div>
          <h1>🚀 Initializing Neural Style Transfer Engine</h1>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${wasmProgress}%` }}
            ></div>
          </div>
          <p>Loading Rust WebAssembly Engine... {wasmProgress}%</p>
          {wasmError && <p className="error">Error: {wasmError}</p>}
        </div>
      </div>
    );
  }

  if (wasmError) {
    return (
      <div className="error-screen">
        <h1>❌ Initialization Failed</h1>
        <p>{wasmError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="particles-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <header className="app-header">
        <h1>🎨 Neural Style Transfer</h1>
        <p>Powered by Rust + WebAssembly + WebGPU</p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <h2>📸 Upload Your Image</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input"
          />
          {selectedImage && (
            <div className="image-preview">
              <img src={selectedImage} alt="Original" />
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="style-section">
            <h2>🎭 Choose Your Style</h2>
            <div className="style-grid">
              {availableStyles.map((style) => {
                const styleInfo = {
                  'van-gogh': { name: '🌟 Van Gogh', desc: 'EXTREME warm swirling colors' },
                  'picasso': { name: '🎭 Picasso', desc: 'EXTREME geometric blocks' },
                  'cyberpunk': { name: '🤖 Cyberpunk', desc: 'EXTREME neon pink/blue' },
                  'watercolor': { name: '🎨 Watercolor', desc: 'Soft flowing paint effects' },
                  'oil-painting': { name: '🖼️ Oil Painting', desc: 'Rich classical textures' },
                  'test': { name: '🧪 Test', desc: 'Color inversion test' }
                }[style] || { name: style.replace('-', ' ').toUpperCase(), desc: 'Artistic style' };
                
                return (
                  <button
                    key={style}
                    onClick={() => handleStyleSelect(style)}
                    className={`style-button ${selectedStyle === style ? 'selected' : ''}`}
                  >
                    <div className="style-name">{styleInfo.name}</div>
                    <div className="style-desc">{styleInfo.desc}</div>
                  </button>
                );
              })}
            </div>

            {selectedStyle && (
              <div className="controls">
                <div className="strength-control">
                  <label htmlFor="strength">Style Strength: {styleStrength}%</label>
                  <input
                    id="strength"
                    type="range"
                    min="0"
                    max="100"
                    value={styleStrength}
                    onChange={(e) => setStyleStrength(parseInt(e.target.value))}
                    className="strength-slider"
                  />
                </div>

                <button
                  onClick={handleStyleTransfer}
                  disabled={isProcessing}
                  className="transfer-button"
                >
                  {isProcessing ? '🎨 Processing...' : '🚀 Apply Style Transfer'}
                </button>
              </div>
            )}
          </div>
        )}

        {stylizedImage && (
          <div className="result-section">
            <h2>✨ Your Stylized Image</h2>
            <div className="image-comparison">
              <div className="image-container">
                <h3>Original</h3>
                <img src={selectedImage} alt="Original" />
                </div>
              <div className="image-container">
                <h3>Stylized ({selectedStyle})</h3>
                <img src={stylizedImage} alt="Stylized" />
              </div>
            </div>
            
            <div className="action-buttons">
              <button onClick={handleDownload} className="download-button">
                💾 Download PNG
              </button>
              <button onClick={handleReset} className="reset-button">
                🔄 Reset
              </button>
            </div>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
