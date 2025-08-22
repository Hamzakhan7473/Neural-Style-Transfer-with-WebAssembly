import React from 'react';
import './StyleControls.css';

interface StyleControlsProps {
  styleStrength: number;
  onStyleStrengthChange: (value: number) => void;
  onStyleTransfer: () => void;
  onReset: () => void;
  onDownload: () => void;
  isProcessing: boolean;
  canProcess: boolean;
}

const StyleControls: React.FC<StyleControlsProps> = ({
  styleStrength,
  onStyleStrengthChange,
  onStyleTransfer,
  onReset,
  onDownload,
  isProcessing,
  canProcess
}) => {
  return (
    <div className="style-controls">
      <h3>Style Controls</h3>
      
      <div className="control-group">
        <label htmlFor="style-strength">
          Style Strength: {Math.round(styleStrength * 100)}%
        </label>
        <input
          id="style-strength"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={styleStrength}
          onChange={(e) => onStyleStrengthChange(parseFloat(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>Original</span>
          <span>Stylized</span>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={onStyleTransfer}
          disabled={!canProcess || isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="spinner-small"></div>
              Processing...
            </>
          ) : (
            'Apply Style Transfer'
          )}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onReset}
          disabled={isProcessing}
        >
          Reset
        </button>

        <button
          className="btn btn-success"
          onClick={onDownload}
          disabled={isProcessing}
        >
          Download PNG
        </button>
      </div>

      <div className="processing-info">
        {isProcessing && (
          <div className="info-message">
            <div className="spinner-small"></div>
            <span>Style transfer in progress... This may take a few moments.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyleControls;
