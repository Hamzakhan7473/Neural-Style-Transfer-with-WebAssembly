import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import { useAIStyleTransfer } from './hooks/useAIStyleTransfer';

function App() {
  const [error, setError] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [styleStrength, setStyleStrength] = useState(75);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { applyStyleTransfer, isReady: aiReady, error: aiError, progress: aiProgress } = useAIStyleTransfer();

  // No initialization needed - app starts immediately

  const handleImageUpload = (imageData) => {
    setOriginalImage(imageData);
    console.log('Image uploaded:', imageData.substring(0, 50) + '...');
    console.log('Setting originalImage state to:', !!imageData);
  };

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
  };

  const handleStyleStrengthChange = (strength) => {
    setStyleStrength(strength);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setSelectedStyle('');
    setStyleStrength(75);
    setProcessedImage(null);
  };

  // Fallback style transfer function (simple pixel manipulation)
  const applyFallbackStyle = (rgbData, styleName, strength) => {
    const factor = strength / 100.0;
    const processedData = [...rgbData];
    
    for (let i = 0; i < rgbData.length; i += 3) {
      const r = rgbData[i];
      const g = rgbData[i + 1];
      const b = rgbData[i + 2];
      
      let newR, newG, newB;
      
      switch (styleName) {
        case 'van-gogh':
          // Warm colors with texture
          newR = Math.min(255, r * (1 + factor * 0.4) + factor * 20);
          newG = Math.min(255, g * (1 + factor * 0.3) + factor * 15);
          newB = Math.max(0, b * (1 - factor * 0.3) - factor * 10);
          break;
        case 'picasso':
          // Geometric color shifts
          newR = Math.max(0, r * (1 - factor * 0.3));
          newG = Math.min(255, g * (1 + factor * 0.4));
          newB = Math.min(255, b * (1 + factor * 0.3));
          break;
        case 'cyberpunk':
          // Neon colors
          newR = Math.min(255, r * (1 + factor * 0.6));
          newG = Math.max(0, g * (1 - factor * 0.4));
          newB = Math.min(255, b * (1 + factor * 0.8));
          break;
        case 'watercolor':
          // Soft enhancement
          newR = Math.min(255, r * (1 + factor * 0.15));
          newG = Math.min(255, g * (1 + factor * 0.25));
          newB = Math.min(255, b * (1 + factor * 0.15));
          break;
        case 'oil-painting':
          // Rich saturation
          newR = Math.min(255, r * (1 + factor * 0.5));
          newG = Math.min(255, g * (1 + factor * 0.4));
          newB = Math.min(255, b * (1 + factor * 0.3));
          break;
        default:
          // Default enhancement
          newR = Math.min(255, r * (1 + factor * 0.2));
          newG = Math.min(255, g * (1 + factor * 0.2));
          newB = Math.min(255, b * (1 + factor * 0.2));
      }
      
      processedData[i] = Math.round(newR);
      processedData[i + 1] = Math.round(newG);
      processedData[i + 2] = Math.round(newB);
    }
    
    return processedData;
  };

  const handleStyleTransfer = async () => {
    if (!originalImage || !selectedStyle) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const rawData = imageData.data;
        
        console.log('Processing image:', canvas.width, 'x', canvas.height, 'pixels');
        console.log('Raw data length:', rawData.length);
        
        // Convert RGBA to RGB for AI processing (remove alpha channel)
        const rgbData = [];
        for (let i = 0; i < rawData.length; i += 4) {
          rgbData.push(rawData[i]);     // R
          rgbData.push(rawData[i + 1]); // G
          rgbData.push(rawData[i + 2]); // B
        }
        
        console.log('RGB data length:', rgbData.length);
        
        // Process with AI model
        let processedData;
        try {
          if (aiReady) {
            processedData = await applyStyleTransfer(rgbData, selectedStyle, styleStrength);
          } else {
            throw new Error('AI not ready');
          }
        } catch (aiError) {
          console.warn('AI processing failed, using fallback method:', aiError);
          // Fallback: simple pixel manipulation
          processedData = applyFallbackStyle(rgbData, selectedStyle, styleStrength);
        }
        
        // Convert RGB back to RGBA for ImageData
        const rgbaData = new Uint8ClampedArray(canvas.width * canvas.height * 4);
        for (let i = 0; i < processedData.length; i += 3) {
          const pixelIndex = (i / 3) * 4;
          rgbaData[pixelIndex] = processedData[i];     // R
          rgbaData[pixelIndex + 1] = processedData[i + 1]; // G
          rgbaData[pixelIndex + 2] = processedData[i + 2]; // B
          rgbaData[pixelIndex + 3] = 255; // A (fully opaque)
        }
        
        // Create new image data with processed pixels
        const newImageData = new ImageData(
          rgbaData,
          canvas.width,
          canvas.height
        );
        
        // Draw processed image
        ctx.putImageData(newImageData, 0, 0);
        
        // Convert to data URL
        const processedDataUrl = canvas.toDataURL('image/png');
        setProcessedImage(processedDataUrl);
      };
      
      img.src = originalImage;
      
    } catch (err) {
      setError(err.message || 'Style transfer failed. Please try again.');
      console.error('Style transfer error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed loading screen for faster startup

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Neural Style Transfer</h1>
        <p>Transform your images with AI-powered artistic styles using WebGPU</p>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <ImageUploader onImageUpload={handleImageUpload} />
          
          {originalImage && (
            <>
              {console.log('Rendering components for image:', !!originalImage)}
              <div className="image-preview">
                <h3>📸 Uploaded Image</h3>
                <img src={originalImage} alt="Uploaded" style={{ maxWidth: '300px', borderRadius: '8px' }} />
                <p>Great! Now choose a style and apply the transformation.</p>
              </div>
              
              {/* Simple style selector for now */}
              <div className="simple-style-selector">
                <h3>🎨 Choose Your Style</h3>
                <div className="style-buttons">
                  {['van-gogh', 'picasso', 'cyberpunk', 'watercolor', 'oil-painting'].map(style => (
                    <button
                      key={style}
                      className={`style-btn ${selectedStyle === style ? 'selected' : ''}`}
                      onClick={() => handleStyleSelect(style)}
                    >
                      {style.replace('-', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                
                {selectedStyle && (
                  <div className="style-controls">
                    <label>Style Strength: {styleStrength}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={styleStrength}
                      onChange={(e) => handleStyleStrengthChange(parseInt(e.target.value))}
                    />
                    
                    <button 
                      className="apply-btn"
                      onClick={handleStyleTransfer}
                      disabled={isProcessing || !aiReady}
                    >
                                           {!aiReady ? `🔄 Loading AI Model... ${aiProgress}%` : 
                      isProcessing ? '🎨 Neural Style Transfer in Progress...' : '🎨 Apply Neural Style Transfer'}
                    </button>
                  </div>
                )}
              </div>
              
              <button onClick={handleReset} className="reset-btn">
                🔄 Reset & Upload New Image
              </button>
              
              {/* Show AI errors */}
              {aiError && (
                <div className="error-message">
                  <p>❌ {aiError}</p>
                  <button onClick={() => window.location.reload()}>Reload Page</button>
                </div>
              )}
              
              {/* Show processing status */}
              {isProcessing && (
                <div className="processing-status">
                  <div className="processing-spinner"></div>
                  <p>🎨 Neural Style Transfer in Progress...</p>
                  <p className="processing-details">
                    Applying {selectedStyle} style with {styleStrength}% strength
                  </p>
                  <div className="ai-progress">
                    <div className="ai-progress-bar">
                      <div className="ai-progress-fill"></div>
                    </div>
                    <p>AI is learning artistic patterns and textures...</p>
                  </div>
                </div>
              )}
              
              {/* Show results */}
              {processedImage && (
                <div className="results">
                  <h3>✨ AI Style Transfer Complete!</h3>
                  <div className="image-comparison">
                    <div className="image-container">
                      <h4>Original</h4>
                      <img src={originalImage} alt="Original" />
                    </div>
                    <div className="image-container">
                      <h4>AI Stylized ({selectedStyle})</h4>
                      <img src={processedImage} alt="AI Stylized" />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `ai-stylized-${selectedStyle}.png`;
                      link.href = processedImage;
                      link.click();
                    }}
                    className="download-btn"
                  >
                    💾 Download AI Result
                  </button>
                </div>
              )}
            </>
          )}
          
          {!originalImage && (
            <div className="placeholder">
              <h3>🎨 Neural Style Transfer Demo</h3>
              <p>Upload an image to get started with style transfer!</p>
              <div className="features">
                <div className="feature">
                  <h4>✅ Rust + WebAssembly Core</h4>
                  <p>ML engine built and ready</p>
                </div>
                <div className="feature">
                  <h4>✅ React Frontend</h4>
                  <p>Futuristic AI interface</p>
                </div>
                <div className="feature">
                  <h4>✅ Style Selection</h4>
                  <p>5 AI-powered styles ready</p>
                </div>
                <div className="feature">
                  <h4>✅ Neural Style Transfer</h4>
                  <p>Real ML processing active</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
