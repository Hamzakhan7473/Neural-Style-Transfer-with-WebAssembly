import React, { useMemo } from 'react';
import './ImageDisplay.css';

interface ImageDisplayProps {
  originalImage: string | null;
  stylizedImage: string | null;
  styleStrength: number;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  originalImage,
  stylizedImage,
  styleStrength
}) => {
  const blendedImage = useMemo(() => {
    if (!originalImage || !stylizedImage) return null;
    
    // Create a canvas to blend the images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const originalImg = new Image();
    const stylizedImg = new Image();
    
    return new Promise<string>((resolve) => {
      originalImg.onload = () => {
        stylizedImg.onload = () => {
          canvas.width = originalImg.width;
          canvas.height = originalImg.height;
          
          // Draw original image
          ctx.globalAlpha = 1 - styleStrength;
          ctx.drawImage(originalImg, 0, 0);
          
          // Draw stylized image with blending
          ctx.globalAlpha = styleStrength;
          ctx.drawImage(stylizedImg, 0, 0);
          
          // Reset alpha
          ctx.globalAlpha = 1.0;
          
          resolve(canvas.toDataURL('image/png'));
        };
        stylizedImg.src = stylizedImage;
      };
      originalImg.src = originalImage;
    });
  }, [originalImage, stylizedImage, styleStrength]);

  if (!originalImage) {
    return (
      <div className="image-display">
        <div className="placeholder">
          <div className="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          </div>
          <h3>Upload an image to get started</h3>
          <p>Choose a style and apply neural style transfer to transform your photos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-display">
      <div className="images-container">
        <div className="image-section">
          <h3>Original Image</h3>
          <div className="image-wrapper">
            <img src={originalImage} alt="Original" />
          </div>
        </div>

        {stylizedImage && (
          <>
            <div className="image-section">
              <h3>Stylized Image</h3>
              <div className="image-wrapper">
                <img src={stylizedImage} alt="Stylized" />
              </div>
            </div>

            <div className="image-section">
              <h3>Blended Result (Strength: {Math.round(styleStrength * 100)}%)</h3>
              <div className="image-wrapper">
                {blendedImage ? (
                  <img src={blendedImage} alt="Blended" />
                ) : (
                  <div className="blending-placeholder">
                    <div className="spinner"></div>
                    <p>Blending images...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {!stylizedImage && (
        <div className="processing-placeholder">
          <div className="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h3>Ready to process</h3>
          <p>Select a style and click "Apply Style Transfer" to begin</p>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
