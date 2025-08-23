import React, { useState } from 'react';
import { useWasmEngine } from '../hooks/useWasmEngine';
import './StyleTransfer.css';

const StyleTransfer = ({ originalImage, selectedStyle, styleStrength, onReset }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);
  
  const { transferStyle, isReady, error: engineError } = useWasmEngine();

  const handleStyleTransfer = async () => {
    if (!originalImage || !selectedStyle || !isReady) return;
    
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
        
        // Process with WASM engine
        const processedData = await transferStyle(Array.from(rawData), selectedStyle, styleStrength);
        
        // Create new image data with processed pixels
        const newImageData = new ImageData(
          new Uint8ClampedArray(processedData),
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

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.download = `stylized-${selectedStyle}.png`;
    link.href = processedImage;
    link.click();
  };

  if (!originalImage || !selectedStyle) {
    return null;
  }

  // Show engine error if any
  if (engineError) {
    return (
      <div className="style-transfer">
        <div className="error-message">
          <p>❌ {engineError}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="style-transfer">
      <div className="transfer-controls">
        <button
          className="transfer-button"
          onClick={handleStyleTransfer}
          disabled={isProcessing || !isReady}
        >
          {!isReady ? '🔄 Initializing AI Engine...' : 
           isProcessing ? '🎨 Processing...' : '🎨 Apply Style Transfer'}
        </button>
        
        {processedImage && (
          <>
            <button className="download-button" onClick={handleDownload}>
              💾 Download PNG
            </button>
            <button className="reset-button" onClick={onReset}>
              🔄 Reset
            </button>
          </>
        )}
      </div>

      {isProcessing && (
        <div className="processing">
          <div className="processing-spinner"></div>
          <p>Applying {selectedStyle} style...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {processedImage && (
        <div className="results">
          <h3>✨ Style Transfer Complete!</h3>
          <div className="image-comparison">
            <div className="image-container">
              <h4>Original</h4>
              <img src={originalImage} alt="Original" />
            </div>
            <div className="image-container">
              <h4>Stylized ({selectedStyle})</h4>
              <img src={processedImage} alt="Stylized" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleTransfer;
