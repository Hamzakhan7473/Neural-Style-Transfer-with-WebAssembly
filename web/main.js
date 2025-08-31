import init, { StyleTransfer } from './pkg/neural_style_transfer.js';

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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
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
  
  // Try to initialize WASM module
  initializeWasmModule();
});

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
    
    const img = new Image();
    img.onload = () => {
      console.log('🖼️ Image loaded:', img.width, 'x', img.height);
      drawToCanvas(img);
    };
    img.onerror = (error) => {
      console.error('❌ Failed to load image:', error);
    };
    img.src = URL.createObjectURL(file);
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
    if (styleTransfer) {
      styleTransfer.set_style_strength(parseFloat(strength.value));
    }
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

async function initializeWasmModule() {
  try {
    console.log('🚀 Initializing WASM module...');
    
    // Check if WASM is supported
    if (typeof WebAssembly === 'undefined') {
      throw new Error('WebAssembly is not supported in this browser');
    }
    
    await init();
    console.log('✅ WASM module initialized');
    
    // Initialize the style transfer
    console.log('🎨 Creating StyleTransfer instance...');
    styleTransfer = new StyleTransfer('canvasOut');
    
    // Try WebGPU initialization
    try {
      await styleTransfer.initialize_webgpu();
      console.log('✅ WebGPU initialized successfully');
    } catch (webgpuError) {
      console.warn('⚠️ WebGPU initialization failed, continuing without GPU acceleration:', webgpuError);
    }
    
    // Update GPU badge
    const adapter = await navigator.gpu?.requestAdapter();
    gpuBadge.textContent = adapter ? `WebGPU: ${adapter.name || 'available'}` : 'WebGPU not supported';
    
    // Load style registry
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
    
    console.log('🎉 WASM setup complete!');
    modelInfo.textContent = '✅ WASM module loaded successfully! Select a style and upload an image to begin.';
    
  } catch (error) {
    console.error('❌ WASM initialization failed:', error);
    modelInfo.textContent = `WASM Error: ${error.message}. The app will work for testing UI but style transfer won't function.`;
    
    // Still populate styles for UI testing
    try {
      const response = await fetch('./styles.json');
      if (response.ok) {
        registry = await response.json();
        styleSel.innerHTML = '<option value="">Choose a style...</option>';
        for (const item of registry.styles) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = `${item.name} (${item.size})`;
          styleSel.appendChild(opt);
        }
        console.log('⚠️ Styles loaded for UI testing, but WASM is not functional');
      }
    } catch (styleError) {
      console.error('❌ Failed to load styles:', styleError);
    }
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
    await styleTransfer.load_style_model(meta.name);
    console.log(`✅ Style model loaded: ${meta.name}`);
    
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
  try {
    if (!originalImageData || !currentMeta) {
      console.log('⚠️ Cannot stylize: missing requirements');
      return;
    }
    
    if (!styleTransfer) {
      console.warn('⚠️ StyleTransfer not initialized');
      alert('Style transfer not ready yet. Please wait for WASM module to load.');
      return;
    }
    
    console.log('🎨 Starting stylization...');
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Processing...';
    
    // Process the image
    await styleTransfer.process_image_from_canvas(canvasIn);
    
    console.log('✅ Stylization complete!');
    runBtn.textContent = '🎨 Stylize';
    runBtn.disabled = false;
    
  } catch (error) {
    console.error('❌ Stylization failed:', error);
    runBtn.textContent = '❌ Error';
    runBtn.disabled = false;
    modelInfo.textContent = `Stylization Error: ${error.message}`;
  }
}
