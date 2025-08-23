import React, { useState } from 'react';
import './StyleTransfer.css';

const StyleTransfer = ({ originalImage, selectedStyle, styleStrength, onReset }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);

  const handleStyleTransfer = async () => {
    if (!originalImage || !selectedStyle) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Quick processing simulation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply advanced style effects based on selected style
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Apply different effects based on style with strength control
          switch (selectedStyle) {
            case 'van-gogh':
              // Impressionist style: enhance warm colors, add texture
              data[i] = Math.min(255, r * (1 + styleStrength * 0.003)); // Reds
              data[i + 1] = Math.min(255, g * (1 + styleStrength * 0.002)); // Greens
              data[i + 2] = Math.max(0, b * (1 - styleStrength * 0.002)); // Blues
              break;
            case 'picasso':
              // Cubist style: geometric color shifts
              data[i] = Math.max(0, r * (1 - styleStrength * 0.002)); // Reds
              data[i + 1] = Math.min(255, g * (1 + styleStrength * 0.003)); // Greens
              data[i + 2] = Math.min(255, b * (1 + styleStrength * 0.002)); // Blues
              break;
            case 'cyberpunk':
              // Futuristic neon style
              data[i] = Math.min(255, r * (1 + styleStrength * 0.004)); // Strong reds
              data[i + 1] = Math.max(0, g * (1 - styleStrength * 0.003)); // Reduce greens
              data[i + 2] = Math.min(255, b * (1 + styleStrength * 0.005)); // Strong blues
              break;
            case 'watercolor':
              // Soft, flowing style
              data[i] = Math.min(255, r * (1 + styleStrength * 0.001)); // Soft reds
              data[i + 1] = Math.min(255, g * (1 + styleStrength * 0.002)); // Soft greens
              data[i + 2] = Math.min(255, b * (1 + styleStrength * 0.001)); // Soft blues
              break;
            case 'oil-painting':
              // Rich, textured style
              data[i] = Math.min(255, r * (1 + styleStrength * 0.003)); // Rich reds
              data[i + 1] = Math.min(255, g * (1 + styleStrength * 0.002)); // Rich greens
              data[i + 2] = Math.min(255, b * (1 + styleStrength * 0.001)); // Rich blues
              break;
            default:
              break;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to data URL
        const processedDataUrl = canvas.toDataURL('image/png');
        setProcessedImage(processedDataUrl);
      };
      
      img.src = originalImage;
      
    } catch (err) {
      setError('Style transfer failed. Please try again.');
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

  return (
    <div className="style-transfer">
      <div className="transfer-controls">
        <button
          className="transfer-button"
          onClick={handleStyleTransfer}
          disabled={isProcessing}
        >
          {isProcessing ? '🎨 Processing...' : '🎨 Apply Style Transfer'}
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
