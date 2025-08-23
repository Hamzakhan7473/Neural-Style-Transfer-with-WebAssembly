import React, { useState } from 'react';
import './StyleSelector.css';

const StyleSelector = ({ onStyleSelect, selectedStyle, onStyleStrengthChange, styleStrength }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const styles = [
    {
      id: 'van-gogh',
      name: 'Van Gogh',
      description: 'Impressionist swirls and vibrant warm colors',
      preview: '🎨',
      effect: 'Enhances reds & greens, reduces blues',
      bestFor: 'Landscapes, portraits, nature scenes'
    },
    {
      id: 'picasso',
      name: 'Picasso',
      description: 'Cubist geometric abstraction with color shifts',
      preview: '🔷',
      effect: 'Reduces reds, enhances greens & blues',
      bestFor: 'Abstract art, modern compositions'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Neon colors and futuristic aesthetics',
      preview: '🤖',
      effect: 'Strong reds & blues, reduces greens',
      bestFor: 'Urban scenes, night photography, tech'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft, flowing paint effects with gentle tones',
      preview: '💧',
      effect: 'Soft enhancement of all colors',
      bestFor: 'Delicate subjects, pastel scenes'
    },
    {
      id: 'oil-painting',
      name: 'Oil Painting',
      description: 'Rich textures and bold, saturated colors',
      preview: '🖼️',
      effect: 'Rich enhancement of all colors',
      bestFor: 'Classical subjects, dramatic scenes'
    }
  ];

  const handleStyleClick = (styleId) => {
    onStyleSelect(styleId);
    setIsExpanded(false);
  };

  return (
    <div className="style-selector">
      <div className="style-selector-header">
        <h3>🎨 Choose Your Style</h3>
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="styles-grid">
          {styles.map((style) => (
            <div
              key={style.id}
              className={`style-option ${selectedStyle === style.id ? 'selected' : ''}`}
              onClick={() => handleStyleClick(style.id)}
            >
              <div className="style-preview">{style.preview}</div>
              <div className="style-info">
                <h4>{style.name}</h4>
                <p className="style-description">{style.description}</p>
                <p className="style-effect">{style.effect}</p>
                <p className="style-best-for"><strong>Best for:</strong> {style.bestFor}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedStyle && (
        <div className="style-controls">
          <div className="selected-style">
            <span>Selected: <strong>{styles.find(s => s.id === selectedStyle)?.name}</strong></span>
          </div>
          
          <div className="style-strength">
            <label htmlFor="strength-slider">Style Strength: {styleStrength}%</label>
            <input
              id="strength-slider"
              type="range"
              min="0"
              max="100"
              value={styleStrength}
              onChange={(e) => onStyleStrengthChange(parseInt(e.target.value))}
              className="strength-slider"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSelector;
