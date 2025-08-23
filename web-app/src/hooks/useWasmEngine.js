import { useState, useEffect, useCallback } from 'react';

export const useWasmEngine = () => {
  const [engine, setEngine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize WASM engine
  const initializeEngine = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Import the WASM module
      const wasmModule = await import('/wasm/neural_style_transfer_core.js');
      await wasmModule.default();
      
      // Create engine instance
      const engineInstance = new wasmModule.StyleTransferEngine();
      
      // Initialize the engine
      await engineInstance.initialize();
      
      // Load default styles
      const styles = ['van-gogh', 'picasso', 'cyberpunk', 'watercolor', 'oil-painting'];
      for (const style of styles) {
        try {
          await engineInstance.load_style(style);
        } catch (err) {
          console.warn(`Failed to load style ${style}:`, err);
        }
      }
      
      setEngine(engineInstance);
      setIsReady(true);
      console.log('WASM engine initialized successfully');
      
    } catch (err) {
      console.error('Failed to initialize WASM engine:', err);
      setError('Failed to initialize AI engine. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Style transfer function
  const transferStyle = useCallback(async (imageData, styleName, styleStrength) => {
    if (!engine || !isReady) {
      throw new Error('Engine not ready');
    }

    try {
      // Convert image data to Uint8Array
      const imageArray = new Uint8Array(imageData);
      
      // Use quick transfer for better performance
      const processedData = engine.quick_transfer_style(imageArray, styleName, styleStrength);
      
      return Array.from(processedData);
      
    } catch (err) {
      console.error('Style transfer failed:', err);
      throw new Error('Style transfer failed. Please try again.');
    }
  }, [engine, isReady]);

  // Initialize on mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engine) {
        // Cleanup if needed
        console.log('Cleaning up WASM engine');
      }
    };
  }, [engine]);

  return {
    engine,
    isLoading,
    error,
    isReady,
    transferStyle,
    retry: initializeEngine
  };
};
