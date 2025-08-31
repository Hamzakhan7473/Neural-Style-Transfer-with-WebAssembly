import init, { StyleTransfer } from './pkg/neural_style_transfer.js';

const fileInput = document.getElementById('file');
const webcamBtn = document.getElementById('webcamBtn');
const styleSel = document.getElementById('style');
const modelInfo = document.getElementById('modelInfo');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const strength = document.getElementById('strength');
const strengthVal = document.getElementById('strengthVal');
const canvasIn = document.getElementById('canvasIn');
const canvasOut = document.getElementById('canvasOut');
const video = document.getElementById('video');
const gpuBadge = document.getElementById('gpu-badge');

const ctxIn = canvasIn.getContext('2d');
const ctxOut = canvasOut.getContext('2d');

let styleTransfer = null;
let registry = null;
let currentMeta = null;
let originalImageData = null; // last still frame drawn into canvasIn
let webcamOn = false;
let webcamRAF = 0;

async function setup() {
  try {
    console.log('🚀 Initializing WASM module...');
    await init();
    console.log('✅ WASM module initialized');
    
    // Initialize the style transfer with the output canvas
    console.log('🎨 Creating StyleTransfer instance...');
    styleTransfer = new StyleTransfer('canvasOut');
    await styleTransfer.initialize_webgpu();
    console.log('✅ StyleTransfer initialized');
    
    const adapter = await navigator.gpu?.requestAdapter();
    gpuBadge.textContent = adapter ? `WebGPU: ${adapter.name || 'available'}` : 'WebGPU not supported';

    // PWA: register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(console.warn);
    }

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
    
    console.log('🎉 Setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    modelInfo.textContent = `Setup Error: ${error.message}`;
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
  // Clear out
  ctxOut.clearRect(0, 0, canvasOut.width, canvasOut.height);
}

fileInput.addEventListener('change', async (e) => {
  if (!fileInput.files.length) return;
  const file = fileInput.files[0];
  const img = new Image();
  img.onload = () => drawToCanvas(img);
  img.src = URL.createObjectURL(file);
  stopWebcam();
});

webcamBtn.addEventListener('click', async () => {
  if (!webcamOn) {
    await startWebcam();
    webcamBtn.textContent = 'Disable Webcam';
  } else {
    stopWebcam();
    webcamBtn.textContent = 'Enable Webcam';
  }
});

async function startWebcam() {
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
      // Try run style at a throttled cadence (every N frames)
      if (currentMeta && performance.now() % 2 < 1) {
        await stylizeOnce();
      }
    }
    webcamRAF = requestAnimationFrame(loop);
  };
  webcamRAF = requestAnimationFrame(loop);
}

function stopWebcam() {
  if (!webcamOn) return;
  webcamOn = false;
  cancelAnimationFrame(webcamRAF);
  video.style.display = 'none';
  const stream = video.srcObject; if (stream) {
    stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

styleSel.addEventListener('change', () => selectStyle(styleSel.value));

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
    
    // Load the style model using the new API
    console.log(`🔄 Loading style model: ${meta.name}`);
    await styleTransfer.load_style_model(meta.name);
    console.log(`✅ Style model loaded: ${meta.name}`);
    
    // Update button states
    runBtn.disabled = false;
    runBtn.textContent = '🎨 Stylize';
    
  } catch (error) {
    console.error('❌ Style selection failed:', error);
    modelInfo.textContent = `Error: ${error.message}`;
    runBtn.disabled = true;
    runBtn.textContent = '❌ Error';
  }
}

strength.addEventListener('input', () => {
  strengthVal.textContent = strength.value;
  // Update the style strength in the WASM module
  if (styleTransfer) {
    styleTransfer.set_style_strength(parseFloat(strength.value));
  }
  
  // If we have last stylized pixels, we can re-blend instantly in JS
  if (lastStylizedImageData && originalImageData) {
    quickBlendAndPaint();
  }
});

let lastStylizedImageData = null;  // ImageData at canvas resolution

async function stylizeOnce() {
  try {
    if (!originalImageData || !currentMeta || !styleTransfer) {
      console.log('⚠️ Cannot stylize: missing requirements');
      return;
    }
    
    console.log('🎨 Starting stylization...');
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Processing...';
    
    // Use the new API to process the image from canvas
    await styleTransfer.process_image_from_canvas(canvasIn);
    
    // Get the processed result from the output canvas
    lastStylizedImageData = ctxOut.getImageData(0, 0, canvasOut.width, canvasOut.height);
    
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

runBtn.addEventListener('click', stylizeOnce);
resetBtn.addEventListener('click', () => {
  if (!originalImageData) return;
  ctxOut.clearRect(0,0,canvasOut.width, canvasOut.height);
  lastStylizedImageData = null;
});

downloadBtn.addEventListener('click', () => {
  if (!styleTransfer) return;
  styleTransfer.download_result(`stylized_${Date.now()}.png`);
});

function quickBlendAndPaint() {
  const a = parseFloat(strength.value);
  const w = canvasOut.width, h = canvasOut.height;
  const base = ctxIn.getImageData(0, 0, w, h); // current frame (or last still)
  const top = lastStylizedImageData;
  if (!top) return;
  const data = base.data;
  const t = top.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i]   = (data[i]   * (1 - a) + t[i]   * a) | 0;
    data[i+1] = (data[i+1] * (1 - a) + t[i+1] * a) | 0;
    data[i+2] = (data[i+2] * (1 - a) + t[i+2] * a) | 0;
    data[i+3] = 255;
  }
  ctxOut.putImageData(base, 0, 0);
}

// Initialize the application
setup();
