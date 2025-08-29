import { useState, useEffect, useCallback, useRef } from 'react';

export const useRustWasmEngine = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const modelRegistryRef = useRef(null);
  const currentModelRef = useRef(null);

  // Initialize WebAssembly module
  const initializeWasm = useCallback(async () => {
    try {
      setProgress(10);
      setError(null);
      
      console.log('🔄 Attempting to load WebAssembly module...');
      
      // Import the Rust WebAssembly module from the public directory
      // Using webpackIgnore to prevent webpack from trying to bundle it
      const wasmModule = await import(/* webpackIgnore: true */ '/wasm/neural_style_transfer_core.js');
      console.log('✅ WebAssembly module imported successfully');
      
      await wasmModule.default();
      console.log('✅ WebAssembly module initialized successfully');
      
      setProgress(30);
      
      // Initialize the style transfer engine
      console.log('🔍 Available exports:', Object.keys(wasmModule));
      const StyleTransferEngine = wasmModule.StyleTransferEngine;
      console.log('🔍 StyleTransferEngine:', StyleTransferEngine);
      console.log('🔍 StyleTransferEngine type:', typeof StyleTransferEngine);
      
      if (typeof StyleTransferEngine !== 'function') {
        throw new Error(`StyleTransferEngine is not a constructor: ${typeof StyleTransferEngine}`);
      }
      
      modelRegistryRef.current = new StyleTransferEngine();
      console.log('✅ StyleTransferEngine created successfully');
      
      setProgress(50);
      
      // Initialize the engine
      console.log('🔄 Initializing engine...');
      await modelRegistryRef.current.initialize();
      console.log('✅ Engine initialized successfully');
      
      setProgress(80);
      
      // Get available styles (hardcoded for now since we're using StyleTransferEngine)
      const availableStyles = ["van-gogh", "picasso", "cyberpunk", "watercolor", "oil-painting"];
      console.log('✅ Available styles:', availableStyles);
      console.log('✅ Available styles length:', availableStyles.length);
      
      setProgress(100);
      setIsInitialized(true);
      setIsLoading(false);
      
      console.log('✅ Rust WebAssembly engine initialized successfully!');
      
    } catch (err) {
      console.error('❌ Failed to initialize Rust WebAssembly engine:', err);
      setError(`Initialization failed: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  // Load a specific style model
  const loadStyleModel = useCallback(async (styleName) => {
    if (!modelRegistryRef.current) {
      throw new Error('Engine not initialized');
    }
    
    try {
      setProgress(0);
      setIsLoading(true);
      
              // Load the style
        await modelRegistryRef.current.load_style(styleName);
        currentModelRef.current = styleName;
      
      setProgress(100);
      setIsLoading(false);
      
      console.log(`✅ Style model '${styleName}' loaded successfully`);
      
    } catch (err) {
      console.error(`❌ Failed to load style model '${styleName}':`, err);
      setError(`Failed to load model: ${err.message}`);
      setIsLoading(false);
      throw err;
    }
  }, []);

      // Apply style transfer using the Rust engine
    const applyStyleTransfer = useCallback(async (imageData, styleName, styleStrength) => {
     if (!modelRegistryRef.current) {
       throw new Error('WebAssembly engine not initialized. Please refresh the page.');
     }
     
     console.log('🎨 Starting style transfer with:', { styleName, styleStrength, modelLoaded: currentModelRef.current });
    
    try {
      setProgress(0);
      setIsLoading(true);
      
              // Ensure the correct model is loaded
        if (currentModelRef.current !== styleName) {
          loadStyleModel(styleName);
        }
      
      setProgress(20);
      
      // Get image dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context. Canvas may not be supported.');
      }
      
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixelData = new Uint8Array(imageDataObj.data);
            
            setProgress(40);
            
            // Apply style transfer using Rust engine
            const result = modelRegistryRef.current.quick_transfer_style(
              pixelData,
              styleName,
              styleStrength / 100.0 // Normalize to 0.0-1.0
            );
            
            setProgress(80);
            
            if (result && result.length > 0) {
              // Convert output data back to ImageData
              const outputImageData = new ImageData(
                new Uint8ClampedArray(result),
                canvas.width,
                canvas.height
              );
              
              setProgress(100);
              setIsLoading(false);
              
              console.log(`✅ Style transfer completed successfully`);
              resolve(outputImageData);
              
            } else {
              throw new Error('Style transfer failed: No output data');
            }
            
          } catch (err) {
            console.error('❌ Style transfer failed:', err);
            setError(`Style transfer failed: ${err.message}`);
            setIsLoading(false);
            reject(err);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageData;
      });
      
    } catch (err) {
      console.error('❌ Style transfer failed:', err);
      setError(`Style transfer failed: ${err.message}`);
      setIsLoading(false);
      throw err;
    }
  }, [loadStyleModel]);

  // Get available styles
  const getAvailableStyles = useCallback(async () => {
    if (!modelRegistryRef.current) {
      return [];
    }
    
    try {
      const styles = await modelRegistryRef.current.get_available_styles();
      return styles;
    } catch (err) {
      console.error('Failed to get available styles:', err);
      return [];
    }
  }, []);

  // Get model metadata
  const getModelMetadata = useCallback(async (styleName) => {
    if (!modelRegistryRef.current) {
      return null;
    }
    
    try {
      const metadata = await modelRegistryRef.current.get_model_metadata(styleName);
      return metadata;
    } catch (err) {
      console.error(`Failed to get metadata for ${styleName}:`, err);
      return null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeWasm();
  }, [initializeWasm]);

  return {
    isLoading,
    isInitialized,
    progress,
    error,
    applyStyleTransfer,
    loadStyleModel,
    getAvailableStyles,
    getModelMetadata,
    currentModel: currentModelRef.current,
  };
};
