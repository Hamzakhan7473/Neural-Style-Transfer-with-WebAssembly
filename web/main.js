import init, { Stylizer } from './pkg/stylizer.js';

// Import the ImagePreprocessor
import './js/imagePreprocessor.js';

// Global variables
let fileInput, webcamBtn, styleSel, modelInfo, runBtn, resetBtn, downloadBtn;
let strength, strengthVal, canvasIn, canvasOut, video, gpuBadge;
let ctxIn, ctxOut;

let styleTransfer = null;
let registry = null;
let currentMeta = null;
let originalImageData = null;
let webcamOn = false;
let webcamRAF = 0;

let imagePreprocessor = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  alert('🚀 JavaScript is running! DOM loaded successfully!');
  console.log('🌐 DOM loaded, initializing elements...');
  
  // Get DOM elements
  fileInput = document.getElementById('file');
  webcamBtn = document.getElementById('webcamBtn');
  styleSel = document.getElementById('style');
  modelInfo = document.getElementById('modelInfo');
  runBtn = document.getElementById('runBtn');
  resetBtn = document.getElementById('resetBtn');
  downloadBtn = document.getElementById('downloadBtn');
  strength = document.getElementById('strength');
  strengthVal = document.getElementById('strengthVal');
  canvasIn = document.getElementById('canvasIn');
  canvasOut = document.getElementById('canvasOut');
  video = document.getElementById('video');
  gpuBadge = document.getElementById('gpu-badge');
  
  // Debug: Check if elements exist
  console.log('🔍 Debug: Checking DOM elements...');
  console.log('File input:', fileInput);
  console.log('Style selector:', styleSel);
  console.log('Run button:', runBtn);
  console.log('Canvas In:', canvasIn);
  console.log('Canvas Out:', canvasOut);
  
  if (!fileInput) {
    console.error('❌ File input element not found!');
    modelInfo.textContent = 'Error: File input element not found';
    return;
  }
  
  if (!styleSel) {
    console.error('❌ Style selector element not found!');
    modelInfo.textContent = 'Error: Style selector element not found';
    return;
  }
  
  if (!canvasIn || !canvasOut) {
    console.error('❌ Canvas elements not found!');
    modelInfo.textContent = 'Error: Canvas elements not found';
    return;
  }
  
  // Get canvas contexts
  ctxIn = canvasIn.getContext('2d');
  ctxOut = canvasOut.getContext('2d');
  
  if (!ctxIn || !ctxOut) {
    console.error('❌ Canvas contexts not available!');
    modelInfo.textContent = 'Error: Canvas contexts not available';
    return;
  }
  
  console.log('✅ All DOM elements found, setting up event listeners...');
  
  // Set up event listeners FIRST (before WASM loading)
  setupEventListeners();
  
  // Load styles immediately for UI functionality
  loadStylesImmediately();
  
  // Try to initialize WASM module
  initializeWasmModule();
});

async function loadStylesImmediately() {
  try {
    console.log('📚 Loading styles immediately for UI...');
    console.log('🔍 Style selector element:', styleSel);
    console.log('🔍 Model info element:', modelInfo);
    
    // Add cache-busting parameter
    const timestamp = Date.now();
    const response = await fetch(`./styles.json?t=${timestamp}`);
    console.log('📡 Fetch response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch styles.json: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.text();
    console.log('📄 Raw response data length:', data.length);
    
    registry = await response.json();
    console.log('📋 Styles loaded immediately:', registry.styles);
    console.log('📊 Registry object keys:', Object.keys(registry));
    
    if (!registry.styles || !Array.isArray(registry.styles)) {
      throw new Error('Invalid styles data structure');
    }
    
    // Populate style dropdown immediately
    console.log('🎨 Populating style dropdown...');
    styleSel.innerHTML = '<option value="">Choose a style...</option>';
    
    for (const item of registry.styles) {
      console.log('➕ Processing style item:', item);
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.name} (${item.size})`;
      styleSel.appendChild(opt);
      console.log(`✅ Added style option: ${item.name} with value: ${item.id}`);
    }
    
    console.log('✅ Styles loaded and dropdown populated immediately');
    console.log('🔍 Final dropdown options count:', styleSel.options.length);
    modelInfo.textContent = '✅ Styles loaded! Select a style and upload an image to begin.';
    
  } catch (error) {
    console.error('❌ Failed to load styles immediately:', error);
    console.error('❌ Error details:', error.stack);
    modelInfo.textContent = `Error loading styles: ${error.message}`;
  }
}

function setupEventListeners() {
  console.log('🔗 Setting up event listeners...');
  
  // File input event listener
  fileInput.addEventListener('change', async (e) => {
    console.log('📁 File input change event triggered');
    console.log('Files:', e.target.files);
    
    if (!e.target.files.length) {
      console.log('⚠️ No files selected');
      return;
    }
    
    const file = e.target.files[0];
    console.log('📁 Selected file:', file.name, file.size, file.type);
    
    await handleFileUpload(file);
    stopWebcam();
  });
  
  // Webcam button event listener
  webcamBtn.addEventListener('click', async () => {
    console.log('📹 Webcam button clicked');
    if (!webcamOn) {
      await startWebcam();
      webcamBtn.textContent = 'Disable Webcam';
    } else {
      stopWebcam();
      webcamBtn.textContent = 'Enable Webcam';
    }
  });
  
  // Style selection event listener
  styleSel.addEventListener('change', () => {
    console.log('🎭 Style selection change event triggered');
    console.log('Selected value:', styleSel.value);
    selectStyle(styleSel.value);
  });
  
  // Strength slider event listener
       strength.addEventListener('input', () => {
       strengthVal.textContent = strength.value;
       // Note: Stylizer handles strength during blend operation
     });
  
  // Run button event listener
  runBtn.addEventListener('click', stylizeOnce);
  
  // Reset button event listener
  resetBtn.addEventListener('click', () => {
    if (!originalImageData) return;
    ctxOut.clearRect(0,0,canvasOut.width, canvasOut.height);
  });
  
  // Download button event listener
  downloadBtn.addEventListener('click', () => {
    if (!styleTransfer) {
      alert('Style transfer not initialized yet. Please wait for WASM module to load.');
      return;
    }
    styleTransfer.download_result(`stylized_${Date.now()}.png`);
  });
  
  console.log('✅ Event listeners set up successfully');
}

async function loadStyles() {
  try {
    console.log('📚 Loading style registry...');
    const response = await fetch('./styles.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch styles.json: ${response.status}`);
    }
    registry = await response.json();
    console.log('📋 Styles loaded:', registry.styles);
    
    // Populate style dropdown
    styleSel.innerHTML = '<option value="">Choose a style...</option>';
    for (const item of registry.styles) {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.name} (${item.size})`;
      styleSel.appendChild(opt);
      console.log(`➕ Added style option: ${item.name}`);
    }
    
    // Select first style by default
    if (registry.styles.length > 0) {
      selectStyle(registry.styles[0].id);
    }
    
    console.log('✅ Style registry loaded successfully');
    
  } catch (error) {
    console.error('❌ Failed to load styles:', error);
    throw error;
  }
}

async function initializeWasmModule() {
  try {
    console.log('🚀 Initializing WASM module...');
    
    // Initialize the image preprocessor
    imagePreprocessor = new ImagePreprocessor();
    console.log('✅ ImagePreprocessor initialized');
    
    // Initialize WASM
    await init();
    console.log('✅ WASM module initialized');
    
    // Create Stylizer instance
    styleTransfer = new Stylizer();
    console.log('✅ Stylizer instance created');
    
    // Load available styles
    await loadStyles();
    console.log('✅ Styles loaded');
    
    console.log('🎉 WASM module initialization complete!');
    
  } catch (error) {
    console.error('❌ Failed to initialize WASM module:', error);
    alert('Failed to initialize WASM module. Please refresh the page.');
  }
}

async function handleFileUpload(file) {
    try {
        console.log('📁 Processing uploaded file:', file.name);
        
        // Use the ImagePreprocessor to handle the file
        const processedImage = await imagePreprocessor.preprocessImage(file, {
            targetSize: 512,           // ONNX model input size
            maintainAspectRatio: false, // Force exact 512x512 for WASM compatibility
            normalize: false,          // Don't normalize for display
            quality: 0.9               // High quality processing
        });
        
        console.log('✅ Image preprocessing completed:', processedImage.metadata);
        
        // Display the processed image
        const canvasIn = document.getElementById('canvasIn');
        const ctxIn = canvasIn.getContext('2d');
        
        // Clear canvas and draw processed image
        ctxIn.clearRect(0, 0, canvasIn.width, canvasIn.height);
        ctxIn.drawImage(processedImage.canvas, 0, 0, canvasIn.width, canvasIn.height);
        
        // Store the processed image data for later use
        window.currentProcessedImage = processedImage;
        
        // Update UI
        document.getElementById('imageInfo').textContent = 
            `✅ File selected: ${file.name} | Size: ${(file.size / 1024).toFixed(1)} KB | Type: ${file.type}`;
        
        console.log('🖼️ Image displayed successfully');
        
    } catch (error) {
        console.error('❌ File upload failed:', error);
        alert(`File upload failed: ${error.message}`);
    }
}

function drawToCanvas(img) {
  const maxW = 1024, maxH = 1024;
  let {width:w, height:h} = img;
  const scale = Math.min(maxW / w, maxH / h, 1);
  w = Math.round(w * scale); h = Math.round(h * scale);
  canvasIn.width = w; canvasIn.height = h;
  canvasOut.width = w; canvasOut.height = h;
  ctxIn.drawImage(img, 0, 0, w, h);
  originalImageData = ctxIn.getImageData(0, 0, w, h);
  ctxOut.clearRect(0, 0, canvasOut.width, canvasOut.height);
}

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
    video.style.display = '';
    webcamOn = true;
    
    const loop = async () => {
      if (!webcamOn) return;
      const w = video.videoWidth, h = video.videoHeight;
      if (w && h) {
        canvasIn.width = w; canvasIn.height = h; canvasOut.width = w; canvasOut.height = h;
        ctxIn.drawImage(video, 0, 0, w, h);
        originalImageData = ctxIn.getImageData(0, 0, w, h);
        if (currentMeta && styleTransfer && performance.now() % 2 < 1) {
          await stylizeOnce();
        }
      }
      webcamRAF = requestAnimationFrame(loop);
    };
    webcamRAF = requestAnimationFrame(loop);
  } catch (error) {
    console.error('❌ Webcam failed:', error);
    alert('Failed to start webcam: ' + error.message);
  }
}

function stopWebcam() {
  if (!webcamOn) return;
  webcamOn = false;
  cancelAnimationFrame(webcamRAF);
  video.style.display = 'none';
  const stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

async function selectStyle(id) {
  try {
    console.log(`🎭 Selecting style: ${id}`);
    const meta = registry.styles.find(s => s.id === id);
    if (!meta) {
      throw new Error(`Style not found: ${id}`);
    }
    
    currentMeta = meta;
    modelInfo.textContent = JSON.stringify(meta, null, 2);
    console.log('📊 Style metadata:', meta);
    
    if (!styleTransfer) {
      console.warn('⚠️ StyleTransfer not initialized yet');
      modelInfo.textContent = '⚠️ WASM module not loaded yet. Please wait...';
      return;
    }
    
         // Load the style model
     console.log(`🔄 Loading style model: ${meta.name}`);
     console.log(`📁 Model file: ${meta.model_url}`);
     console.log(`📊 Model metadata:`, meta);
     
     try {
       const metaJson = JSON.stringify(meta);
       console.log(`📝 Sending metadata to WASM:`, metaJson);
       
       styleTransfer.load_model(metaJson);
       console.log(`✅ Style model loaded: ${meta.name}`);
       
       // Verify model was loaded
       console.log(`🔍 Checking if model is ready...`);
       
     } catch (error) {
       console.error(`❌ Failed to load style model:`, error);
       modelInfo.textContent = `Error loading model: ${error.message}`;
       return;
     }
    
    runBtn.disabled = false;
    runBtn.textContent = '🎨 Stylize';
    
  } catch (error) {
    console.error('❌ Style selection failed:', error);
    modelInfo.textContent = `Error: ${error.message}`;
    runBtn.disabled = true;
    runBtn.textContent = '❌ Error';
  }
}

async function stylizeOnce() {
  if (!styleTransfer || !window.currentProcessedImage) {
    alert('Please upload an image first and ensure WASM is initialized.');
    return;
  }
  
  try {
    console.log('🎨 Starting style transfer...');
    
    // Get the processed image data
    const processedImage = window.currentProcessedImage;
    const inputImageData = processedImage.imageData;
    
    // Validate the image data
    const validation = imagePreprocessor.validateImageData(inputImageData);
    if (!validation.isValid) {
      throw new Error(`Image validation failed: ${validation.issues.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Image warnings:', validation.warnings);
    }
    
    // Get image statistics for debugging
    const stats = imagePreprocessor.getImageStats(inputImageData);
    console.log('📊 Image statistics:', stats);
    
            // Convert to Uint8Array for WASM
        const inputRgba = imagePreprocessor.toUint8Array(inputImageData);
        const { width, height } = inputImageData;
        
        // Ensure dimensions are exactly 512x512 for WASM compatibility
        if (width !== 512 || height !== 512) {
            throw new Error(`Invalid input dimensions: ${width}x${height}. Expected: 512x512`);
        }
        
        console.log('🎨 Calling WASM run_style method...');
        console.log('📊 Input data sample (first 20 values):', inputRgba.slice(0, 20));
        console.log('📐 Input dimensions:', width, 'x', height);
    
            // Call WASM style transfer - always use 512x512 for processing
        const targetSize = 512;
        const outputRgba = styleTransfer.run_style(inputRgba, targetSize, targetSize);
        
        console.log('📊 Output data sample (first 20 values):', outputRgba.slice(0, 20));
        console.log('📐 Output dimensions:', targetSize, 'x', targetSize);
        
        // Check if output is different from input
        let isDifferent = false;
        for (let i = 0; i < Math.min(100, inputRgba.length); i++) {
            if (inputRgba[i] !== outputRgba[i]) {
                isDifferent = true;
                break;
            }
        }
        
        if (!isDifferent) {
            console.warn('⚠️  Output data appears identical to input - style transfer may not be working');
        } else {
            console.log('✅ Output data is different from input - style transfer is working');
        }
        
        // Create output ImageData at exactly 512x512
        const outputImageData = new ImageData(
            new Uint8ClampedArray(outputRgba),
            targetSize,
            targetSize
        );
    
            // Create output canvas and resize to display dimensions
        const outputCanvas = imagePreprocessor.createCanvas(outputImageData);
        const canvasOut = document.getElementById('canvasOut');
        const ctxOut = canvasOut.getContext('2d');
        
        // Clear output canvas
        ctxOut.clearRect(0, 0, canvasOut.width, canvasOut.height);
        
        // Draw the 512x512 stylized image and resize to fit the display canvas
        ctxOut.drawImage(outputCanvas, 0, 0, canvasOut.width, canvasOut.height);
    
    console.log('✅ Style transfer completed successfully');
    
    // Show success message
    const resultInfo = document.getElementById('resultInfo');
    if (resultInfo) {
      resultInfo.textContent = '🎨 Style transfer completed!';
      resultInfo.style.color = '#28a745';
    }
    
  } catch (error) {
    console.error('❌ Style transfer failed:', error);
    alert(`Style transfer failed: ${error.message}`);
    
    // Show error message
    const resultInfo = document.getElementById('resultInfo');
    if (resultInfo) {
      resultInfo.textContent = '❌ Style transfer failed';
      resultInfo.style.color = '#dc3545';
    }
  }
}
