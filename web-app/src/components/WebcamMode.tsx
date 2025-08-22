import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleTransferEngine } from '../../wasm/neural_style_transfer_core';
import './WebcamMode.css';

interface WebcamModeProps {
  engine: StyleTransferEngine | null;
  selectedStyle: string;
  styleStrength: number;
}

const WebcamMode: React.FC<WebcamModeProps> = ({ engine, selectedStyle, styleStrength }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fps, setFps] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please check permissions.');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const processFrame = useCallback(async () => {
    if (!engine || !selectedStyle || !videoRef.current || !canvasRef.current || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Convert to Uint8Array for WASM processing
      const bytes = new Uint8Array(imageData.data.buffer);
      
      // Process with style transfer
      const progressCallback = (progress: number) => {
        // Real-time processing doesn't need progress updates
      };

      const result = await engine.transfer_style(
        bytes.toArray(),
        selectedStyle,
        progressCallback
      );

      // Convert result back to image data and display
      const resultArray = new Uint8Array(result);
      const resultImageData = new ImageData(
        new Uint8ClampedArray(resultArray),
        canvas.width,
        canvas.height
      );

      // Blend with original based on style strength
      const blendedData = new Uint8ClampedArray(imageData.data.length);
      for (let i = 0; i < imageData.data.length; i += 4) {
        blendedData[i] = Math.round(imageData.data[i] * (1 - styleStrength) + resultImageData.data[i] * styleStrength);
        blendedData[i + 1] = Math.round(imageData.data[i + 1] * (1 - styleStrength) + resultImageData.data[i + 1] * styleStrength);
        blendedData[i + 2] = Math.round(imageData.data[i + 2] * (1 - styleStrength) + resultImageData.data[i + 2] * styleStrength);
        blendedData[i + 3] = imageData.data[i + 3]; // Keep alpha
      }

      const blendedImageData = new ImageData(blendedData, canvas.width, canvas.height);
      ctx.putImageData(blendedImageData, 0, 0);

      // Update FPS counter
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [engine, selectedStyle, styleStrength, isProcessing]);

  useEffect(() => {
    if (isStreaming && !isProcessing) {
      const interval = setInterval(processFrame, 1000 / 30); // Target 30 FPS
      return () => clearInterval(interval);
    }
  }, [isStreaming, isProcessing, processFrame]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return (
    <div className="webcam-mode">
      <div className="webcam-header">
        <h3>Live Style Transfer</h3>
        <div className="webcam-controls">
          {!isStreaming ? (
            <button className="btn btn-primary" onClick={startWebcam}>
              Start Webcam
            </button>
          ) : (
            <button className="btn btn-danger" onClick={stopWebcam}>
              Stop Webcam
            </button>
          )}
        </div>
        {isStreaming && (
          <div className="webcam-stats">
            <span>FPS: {fps}</span>
            <span>Resolution: {videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}</span>
          </div>
        )}
      </div>

      <div className="webcam-container">
        <div className="video-section">
          <h4>Live Input</h4>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video"
          />
        </div>

        <div className="canvas-section">
          <h4>Stylized Output</h4>
          <canvas
            ref={canvasRef}
            className="webcam-canvas"
          />
          {isProcessing && (
            <div className="processing-overlay">
              <div className="spinner"></div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {!isStreaming && (
        <div className="webcam-placeholder">
          <div className="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7a16 16 0 0 0-13.5 3L8 9H6a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4h-2l-1.5-1.5A16 16 0 0 0 23 7z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <h3>Webcam Mode</h3>
          <p>Click "Start Webcam" to begin live style transfer</p>
        </div>
      )}
    </div>
  );
};

export default WebcamMode;
