import React from 'react';
import { StyleModel } from '../types';
import './StyleSelector.css';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (styleName: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleSelect }) => {
  const availableStyles: StyleModel[] = [
    {
      name: 'van-gogh',
      description: 'Van Gogh Starry Night',
      size: 2.4,
      inputTensorName: 'input_image',
      outputTensorName: 'output_image',
      recommendedResolution: { width: 512, height: 512 },
      previewImage: '/styles/van-gogh-preview.jpg'
    },
    {
      name: 'picasso',
      description: 'Picasso Cubist Style',
      size: 1.8,
      inputTensorName: 'input_image',
      outputTensorName: 'output_image',
      recommendedResolution: { width: 512, height: 512 },
      previewImage: '/styles/picasso-preview.jpg'
    },
    {
      name: 'cyberpunk',
      description: 'Cyberpunk Neon Aesthetic',
      size: 3.2,
      inputTensorName: 'input_image',
      outputTensorName: 'output_image',
      recommendedResolution: { width: 512, height: 512 },
      previewImage: '/styles/cyberpunk-preview.jpg'
    },
    {
      name: 'watercolor',
      description: 'Watercolor Painting',
      size: 2.1,
      inputTensorName: 'input_image',
      outputTensorName: 'output_image',
      recommendedResolution: { width: 512, height: 512 },
      previewImage: '/styles/watercolor-preview.jpg'
    },
    {
      name: 'oil-painting',
      description: 'Classic Oil Painting',
      size: 2.7,
      inputTensorName: 'input_image',
      outputTensorName: 'output_image',
      recommendedResolution: { width: 512, height: 512 },
      previewImage: '/styles/oil-painting-preview.jpg'
    }
  ];

  return (
    <div className="style-selector">
      <h3>Choose Style</h3>
      <div className="styles-grid">
        {availableStyles.map((style) => (
          <div
            key={style.name}
            className={`style-option ${selectedStyle === style.name ? 'selected' : ''}`}
            onClick={() => onStyleSelect(style.name)}
          >
            <div className="style-preview">
              <img 
                src={style.previewImage} 
                alt={style.description}
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyNUg3NVY3NUgyNVoiIHN0cm9rZT0iI0M3Q0RDNyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0zNSAzNUg2NVY2NUgzNVoiIHN0cm9rZT0iI0M3Q0RDNyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=';
                }}
              />
            </div>
            <div className="style-info">
              <h4>{style.description}</h4>
              <p className="style-size">{style.size.toFixed(1)} MB</p>
              <p className="style-resolution">
                {style.recommendedResolution.width}×{style.recommendedResolution.height}
              </p>
            </div>
            {selectedStyle === style.name && (
              <div className="selection-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
