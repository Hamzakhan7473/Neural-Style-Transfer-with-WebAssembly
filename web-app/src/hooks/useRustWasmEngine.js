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
      
      // Initialize the model registry
      const ModelRegistry = wasmModule.ModelRegistry;
      modelRegistryRef.current = new ModelRegistry();
      
      setProgress(50);
      
      // Initialize the engine (now synchronous)
      modelRegistryRef.current.initialize();
      
      setProgress(80);
      
      // Get available styles (synchronous)
      const availableStyles = modelRegistryRef.current.get_available_styles();
      console.log('✅ Available styles from Rust:', availableStyles);
      console.log('✅ Available styles length:', availableStyles ? availableStyles.length : 'undefined');
      
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
      
              // Load the model (now synchronous)
        console.log(`🔄 About to load model: ${styleName}`);
        modelRegistryRef.current.load_model(styleName);
        console.log(`✅ Model loaded successfully: ${styleName}`);
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
            
            // Apply style transfer using Rust engine (now synchronous)
            const result = modelRegistryRef.current.apply_style_transfer(
              pixelData,
              canvas.width,
              canvas.height,
              styleStrength / 100.0, // Normalize to 0.0-1.0
              styleName
            );
            
            setProgress(80);
            
            if (result.success && result.output_data) {
              // Convert output data back to ImageData
              const outputImageData = new ImageData(
                new Uint8ClampedArray(result.output_data),
                canvas.width,
                canvas.height
              );
              
              setProgress(100);
              setIsLoading(false);
              
              console.log(`✅ Style transfer completed in ${result.processing_time_ms.toFixed(2)}ms`);
              resolve(outputImageData);
              
            } else {
              throw new Error(result.error_message || 'Style transfer failed');
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
