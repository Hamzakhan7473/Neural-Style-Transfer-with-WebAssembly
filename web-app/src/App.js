import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import StyleSelector from './components/StyleSelector';
import StyleTransfer from './components/StyleTransfer';

function App() {
  const [error, setError] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [styleStrength, setStyleStrength] = useState(75);

  // No initialization needed - app starts immediately

  const handleImageUpload = (imageData) => {
    setOriginalImage(imageData);
    console.log('Image uploaded:', imageData.substring(0, 50) + '...');
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
              <div className="image-preview">
                <h3>📸 Uploaded Image</h3>
                <img src={originalImage} alt="Uploaded" style={{ maxWidth: '300px', borderRadius: '8px' }} />
                <p>Great! Now choose a style and apply the transformation.</p>
              </div>
              
              <StyleSelector
                onStyleSelect={handleStyleSelect}
                selectedStyle={selectedStyle}
                onStyleStrengthChange={handleStyleStrengthChange}
                styleStrength={styleStrength}
              />
              
              <StyleTransfer
                originalImage={originalImage}
                selectedStyle={selectedStyle}
                styleStrength={styleStrength}
                onReset={handleReset}
              />
            </>
          )}
          
          {!originalImage && (
            <div className="placeholder">
              <h3>🎨 Neural Style Transfer Demo</h3>
              <p>Upload an image to get started with style transfer!</p>
              <div className="features">
                <div className="feature">
                  <h4>✅ Rust + WebAssembly Core</h4>
                  <p>Built and ready</p>
                </div>
                <div className="feature">
                  <h4>✅ React Frontend</h4>
                  <p>Running successfully</p>
                </div>
                <div className="feature">
                  <h4>✅ Style Selection</h4>
                  <p>5 artistic styles available</p>
                </div>
                <div className="feature">
                  <h4>✅ Style Transfer</h4>
                  <p>Mock processing ready</p>
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
