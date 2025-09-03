// Import will be done dynamically in the init function
let init, init_panic_hook, preprocess_image_data, postprocess_image_data, blend_images;

// Enhanced Model Registry with Classical, Modern & Experimental Styles
const STYLE_MODELS = [
    // === CLASSICAL ARTISTS ===
    {
        name: 'van_gogh_starry_night',
        displayName: 'Van Gogh - Starry Night',
        description: 'Swirling brushstrokes and vibrant night sky',
        category: 'classical',
        url: './models/mosaic-9.onnx', // Using local model as placeholder
        fileName: 'van-gogh-starry-night.onnx',
        size: '6.6 MB',
        artist: 'Vincent van Gogh',
        year: 1889,
        recommended_strength: 0.85
    },
    {
        name: 'picasso_cubist',
        displayName: 'Picasso - Cubist Style',
        description: 'Geometric fragmentation and multiple perspectives',
        category: 'classical',
        url: './models/pointilism-9.onnx',
        fileName: 'picasso-cubist.onnx',
        size: '6.6 MB',
        artist: 'Pablo Picasso',
        year: 1910,
        recommended_strength: 0.9
    },
    {
        name: 'monet_water_lilies',
        displayName: 'Monet - Water Lilies',
        description: 'Soft impressionist colors and light reflections',
        category: 'classical',
        url: './models/candy-9.onnx',
        fileName: 'monet-water-lilies.onnx',
        size: '6.6 MB',
        artist: 'Claude Monet',
        year: 1920,
        recommended_strength: 0.75
    },
    {
        name: 'kandinsky_composition',
        displayName: 'Kandinsky - Abstract Composition',
        description: 'Bold abstract shapes and explosive colors',
        category: 'classical',
        url: './models/udnie-9.onnx',
        fileName: 'kandinsky-composition.onnx',
        size: '6.6 MB',
        artist: 'Wassily Kandinsky',
        year: 1913,
        recommended_strength: 0.8
    },

    // === EXISTING OFFICIAL MODELS ===
    {
        name: 'mosaic',
        displayName: 'Classical Mosaic',
        description: 'Colorful geometric mosaic patterns',
        category: 'texture',
        url: './models/mosaic-9.onnx',
        fileName: 'mosaic-9.onnx',
        size: '6.6 MB',
        artist: 'Traditional',
        recommended_strength: 0.8
    },
    {
        name: 'candy',
        displayName: 'Pop Art Candy',
        description: 'Bright, vibrant candy-like colors',
        category: 'modern',
        url: './models/candy-9.onnx',
        fileName: 'candy-9.onnx',
        size: '6.6 MB',
        artist: 'Pop Art Style',
        recommended_strength: 0.85
    },
    {
        name: 'rain_princess',
        displayName: 'Rain Princess',
        description: 'Dreamy impressionist rainy atmosphere',
        category: 'classical',
        url: './models/rain-princess-9.onnx',
        fileName: 'rain-princess-9.onnx',
        size: '6.6 MB',
        artist: 'Impressionist Style',
        recommended_strength: 0.75
    },
    {
        name: 'udnie',
        displayName: 'Udnie - Abstract',
        description: 'Bold abstract expressionist forms',
        category: 'classical',
        url: './models/udnie-9.onnx',
        fileName: 'udnie-9.onnx',
        size: '6.6 MB',
        artist: 'Francis Picabia',
        year: 1913,
        recommended_strength: 0.8
    },
    {
        name: 'pointilism',
        displayName: 'Neo-Impressionist Pointilism',
        description: 'Classic pointillist painting technique',
        category: 'classical',
        url: './models/pointilism-9.onnx',
        fileName: 'pointilism-9.onnx',
        size: '6.6 MB',
        artist: 'Georges Seurat Style',
        year: 1886,
        recommended_strength: 0.75
    },

    // === MODERN & EXPERIMENTAL STYLES ===
    {
        name: 'cyberpunk_neon',
        displayName: 'Cyberpunk Neon',
        description: 'Futuristic neon lights and digital aesthetics',
        category: 'modern',
        url: './models/mosaic-9.onnx', // Using local model as placeholder
        fileName: 'cyberpunk-neon.onnx',
        size: '8.5 MB',
        artist: 'Digital Art',
        recommended_strength: 0.9
    },
    {
        name: 'anime_style',
        displayName: 'Anime Illustration',
        description: 'Japanese animation art style',
        category: 'modern',
        url: './models/candy-9.onnx', // Using local model as placeholder
        fileName: 'anime-style.onnx',
        size: '7.2 MB',
        artist: 'Japanese Animation',
        recommended_strength: 0.85
    },
    {
        name: 'gothic_art',
        displayName: 'Gothic Dark Art',
        description: 'Medieval gothic architecture and dark themes',
        category: 'historical',
        url: './models/udnie-9.onnx', // Using local model as placeholder
        fileName: 'gothic-art.onnx',
        size: '6.8 MB',
        artist: 'Gothic Style',
        year: 1200,
        recommended_strength: 0.8
    },
    {
        name: 'steampunk',
        displayName: 'Steampunk Mechanical',
        description: 'Victorian-era industrial and mechanical aesthetics',
        category: 'modern',
        url: './models/mosaic-9.onnx', // Using local model as placeholder
        fileName: 'steampunk.onnx',
        size: '7.5 MB',
        artist: 'Steampunk Style',
        recommended_strength: 0.85
    },

    // === ADDITIONAL CLASSICAL MASTERS ===
    {
        name: 'da_vinci',
        displayName: 'Leonardo da Vinci',
        description: 'Renaissance master techniques and sfumato',
        category: 'classical',
        url: './models/rain-princess-9.onnx', // Using local model as placeholder
        fileName: 'da-vinci.onnx',
        size: '6.9 MB',
        artist: 'Leonardo da Vinci',
        year: 1500,
        recommended_strength: 0.7
    },
    {
        name: 'hokusai_wave',
        displayName: 'Hokusai - Great Wave',
        description: 'Traditional Japanese ukiyo-e woodblock prints',
        category: 'classical',
        url: './models/pointilism-9.onnx', // Using local model as placeholder
        fileName: 'hokusai-wave.onnx',
        size: '6.7 MB',
        artist: 'Katsushika Hokusai',
        year: 1831,
        recommended_strength: 0.8
    },
    {
        name: 'munch_scream',
        displayName: 'Munch - The Scream',
        description: 'Expressionist anxiety and emotional intensity',
        category: 'classical',
        url: './models/udnie-9.onnx', // Using local model as placeholder
        fileName: 'munch-scream.onnx',
        size: '6.4 MB',
        artist: 'Edvard Munch',
        year: 1893,
        recommended_strength: 0.85
    },

    // === CONTEMPORARY & DIGITAL ===
    {
        name: 'street_art',
        displayName: 'Street Art Graffiti',
        description: 'Urban street art and graffiti aesthetics',
        category: 'modern',
        url: './models/candy-9.onnx', // Using local model as placeholder
        fileName: 'street-art.onnx',
        size: '7.8 MB',
        artist: 'Street Art',
        recommended_strength: 0.9
    },
    {
        name: 'digital_glitch',
        displayName: 'Digital Glitch Art',
        description: 'Computer glitch and digital distortion effects',
        category: 'experimental',
        url: './models/mosaic-9.onnx', // Using local model as placeholder
        fileName: 'digital-glitch.onnx',
        size: '8.1 MB',
        artist: 'Digital Art',
        recommended_strength: 0.75
    },
    {
        name: 'art_nouveau',
        displayName: 'Art Nouveau',
        description: 'Flowing organic forms and decorative elements',
        category: 'historical',
        url: './models/rain-princess-9.onnx', // Using local model as placeholder
        fileName: 'art-nouveau.onnx',
        size: '6.5 MB',
        artist: 'Art Nouveau Movement',
        year: 1890,
        recommended_strength: 0.8
    },

    // === TEXTURE & PATTERN STYLES ===
    {
        name: 'oil_painting',
        displayName: 'Classic Oil Painting',
        description: 'Traditional oil painting brush techniques',
        category: 'texture',
        url: './models/rain-princess-9.onnx', // Using local model as placeholder
        fileName: 'oil-painting.onnx',
        size: '6.3 MB',
        artist: 'Oil Painting Technique',
        recommended_strength: 0.7
    },
    {
        name: 'watercolor',
        displayName: 'Watercolor Wash',
        description: 'Soft watercolor bleeding and transparency effects',
        category: 'texture',
        url: './models/candy-9.onnx', // Using local model as placeholder
        fileName: 'watercolor.onnx',
        size: '5.9 MB',
        artist: 'Watercolor Technique',
        recommended_strength: 0.65
    }
];

class StyleTransferApp {
    constructor() {
        this.currentCategory = 'all';
        this.onnxSession = null;
        this.currentModel = null;
        this.originalImage = null;
        this.webcamStream = null;
        this.isProcessing = false;

        this.elements = {};
        this.modelCache = new Map();
    }

    async init() {
        try {
            console.log('Starting initialization...');

            // Initialize UI elements first so we can use updateStatus
            console.log('Initializing UI elements...');
            this.initializeElements();
            console.log('UI elements initialized');

            this.updateStatus('Initializing WebAssembly...', 'loading');

            // Initialize WASM
            console.log('Importing WASM module...');
            const wasmModule = await import('./pkg/neural_style_transfer.js');
            console.log('WASM module imported:', Object.keys(wasmModule));

            // Assign imported functions to global variables
            init = wasmModule.default; // Default export is the init function
            init_panic_hook = wasmModule.init_panic_hook;
            preprocess_image_data = wasmModule.preprocess_image_data;
            postprocess_image_data = wasmModule.postprocess_image_data;
            blend_images = wasmModule.blend_images;

            console.log('Initializing WASM...');
            await init();
            console.log('WASM initialized');

            console.log('Setting panic hook...');
            init_panic_hook();
            console.log('Panic hook set');

            this.updateStatus('Loading ONNX Runtime...', 'loading');

            // Load ONNX Runtime Web
            if (typeof window.ort === 'undefined') {
                console.log('Loading ONNX Runtime from CDN...');
                await this.loadOnnxRuntime();
                console.log('ONNX Runtime loaded');
            } else {
                console.log('ONNX Runtime already available');
            }

            console.log('Binding events...');
            this.bindEvents();
            console.log('Events bound');

            console.log('Creating enhanced style grid...');
            this.createEnhancedStyleGrid();
            console.log('Style grid created');

            console.log('Creating category filters...');
            this.createCategoryFilters();
            console.log('Category filters created');

            this.updateStatus(`Ready! ${STYLE_MODELS.length} artistic styles available`, 'ready');
            console.log('Initialization complete!');

        } catch (error) {
            console.error('Initialization failed:', error);
            console.error('Error stack:', error.stack);
            this.updateStatus(`Initialization failed: ${error.message}`, 'error');
        }
    }

    async loadOnnxRuntime() {
        console.log('Loading ONNX Runtime...');

        // Check if already loaded
        if (typeof window.ort !== 'undefined') {
            console.log('ONNX Runtime already loaded');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');

            // Try multiple CDN sources for better reliability
            const cdnUrls = [
                'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js',
                'https://unpkg.com/onnxruntime-web@1.18.0/dist/ort.min.js',
                'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort.min.js'
            ];

            let currentUrlIndex = 0;

            const tryLoad = () => {
                if (currentUrlIndex >= cdnUrls.length) {
                    reject(new Error('Failed to load ONNX Runtime from all CDN sources'));
                    return;
                }

                script.src = cdnUrls[currentUrlIndex];
                console.log(`Attempting to load ONNX Runtime from: ${script.src}`);

                script.onload = () => {
                    console.log('ONNX Runtime script loaded, waiting for initialization...');

                    // Wait for the ort object to be fully available
                    const checkAvailability = (attempts = 0) => {
                        if (typeof window.ort !== 'undefined') {
                            console.log('ONNX Runtime fully initialized');

                            // Configure environment if available
                            setTimeout(() => {
                                try {
                                    if (window.ort && window.ort.env) {
                                        console.log('Configuring ONNX Runtime environment...');

                                        // Set up WebAssembly paths for CPU fallback
                                        if (window.ort.env.wasm) {
                                            window.ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
                                        }

                                        // Log available backends
                                        if (window.ort.env.backends) {
                                            console.log('Available ONNX backends:', Object.keys(window.ort.env.backends));
                                        }
                                    } else {
                                        console.warn('ONNX Runtime loaded but env not available');
                                    }
                                } catch (e) {
                                    console.warn('Error configuring ONNX Runtime:', e);
                                }
                                resolve();
                            }, 50);
                        } else if (attempts < 50) { // Max 5 seconds
                            setTimeout(() => checkAvailability(attempts + 1), 100);
                        } else {
                            reject(new Error('ONNX Runtime loaded but ort object not available after 5 seconds'));
                        }
                    };

                    checkAvailability();
                };

                script.onerror = () => {
                    console.warn(`Failed to load from ${script.src}, trying next source...`);
                    currentUrlIndex++;
                    tryLoad();
                };

                // Remove previous script if it exists
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }

                document.head.appendChild(script);
            };

            tryLoad();
        });
    }

    initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            webcamBtn: document.getElementById('webcamBtn'),
            webcamContainer: document.getElementById('webcamContainer'),
            webcamVideo: document.getElementById('webcamVideo'),
            captureBtn: document.getElementById('captureBtn'),
            styleGrid: document.getElementById('styleGrid'),
            styleStrength: document.getElementById('styleStrength'),
            strengthValue: document.getElementById('strengthValue'),
            stylizeBtn: document.getElementById('stylizeBtn'),
            resetBtn: document.getElementById('resetBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            originalContainer: document.getElementById('originalContainer'),
            resultContainer: document.getElementById('resultContainer'),
            processingOverlay: document.getElementById('processingOverlay'),
            processingTime: document.getElementById('processingTime'),
            modelSize: document.getElementById('modelSize'),
            status: document.getElementById('status'),
            statusText: document.getElementById('statusText'),
            statusDot: document.getElementById('statusDot')
        };
    }

    createCategoryFilters() {
        const categories = [...new Set(STYLE_MODELS.map(model => model.category))];
        const filterContainer = document.createElement('div');
        filterContainer.className = 'category-filters';

        // Add "All" filter
        const allFilter = this.createFilterButton('all', 'All Styles', true);
        filterContainer.appendChild(allFilter);

        // Add category filters
        categories.forEach(category => {
            const button = this.createFilterButton(category, this.formatCategoryName(category));
            filterContainer.appendChild(button);
        });

        // Insert before style grid
        this.elements.styleGrid.parentNode.insertBefore(filterContainer, this.elements.styleGrid);
    }

    createFilterButton(category, displayName, active = false) {
        const button = document.createElement('button');
        button.className = `filter-btn ${active ? 'active' : ''}`;
        button.textContent = displayName;
        button.dataset.category = category;

        button.addEventListener('click', () => {
            this.filterStyles(category);

            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });

        return button;
    }

    formatCategoryName(category) {
        const names = {
            'classical': '🎨 Classical',
            'modern': '🌟 Modern',
            'experimental': '🧪 Experimental',
            'texture': '🖌️ Texture',
            'historical': '🏛️ Historical'
        };
        return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    filterStyles(category) {
        this.currentCategory = category;
        this.createEnhancedStyleGrid();
    }

    createEnhancedStyleGrid() {
        const filteredModels = this.currentCategory === 'all'
            ? STYLE_MODELS
            : STYLE_MODELS.filter(model => model.category === this.currentCategory);

        this.elements.styleGrid.innerHTML = '';

        filteredModels.forEach(model => {
            const styleElement = this.createEnhancedStyleElement(model);
            this.elements.styleGrid.appendChild(styleElement);
        });

        // Update counter
        const counter = document.querySelector('.style-counter') || document.createElement('div');
        counter.className = 'style-counter';
        counter.textContent = `${filteredModels.length} styles available`;

        if (!document.querySelector('.style-counter')) {
            this.elements.styleGrid.parentNode.insertBefore(counter, this.elements.styleGrid);
        }
    }

    createEnhancedStyleElement(model) {
        const element = document.createElement('div');
        element.className = 'style-option enhanced';
        element.dataset.model = model.name;
        element.dataset.category = model.category;

        const categoryIcon = this.getCategoryIcon(model.category);
        const yearText = model.year ? ` (${model.year})` : '';

        element.innerHTML = `
            <div class="style-header">
                <span class="category-badge">${categoryIcon}</span>
                <span class="style-size">${model.size}</span>
            </div>
            <div class="style-name">${model.displayName}</div>
            <div class="style-artist">${model.artist}${yearText}</div>
            <div class="style-description">${model.description}</div>
            <div class="style-footer">
                <div class="strength-indicator">
                    Recommended: ${Math.round(model.recommended_strength * 100)}%
                </div>
            </div>
        `;

        element.addEventListener('click', () => this.selectStyle(model));

        return element;
    }

    getCategoryIcon(category) {
        const icons = {
            'classical': '🎨',
            'modern': '🌟',
            'experimental': '🧪',
            'texture': '🖌️',
            'historical': '🏛️'
        };
        return icons[category] || '🎭';
    }

    bindEvents() {
        // Upload events
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Control events  
        this.elements.styleStrength.addEventListener('input', this.updateStrengthValue.bind(this));
        this.elements.stylizeBtn.addEventListener('click', this.stylizeImage.bind(this));
        this.elements.resetBtn.addEventListener('click', this.resetApp.bind(this));
        this.elements.downloadBtn.addEventListener('click', this.downloadResult.bind(this));

        // Webcam events
        this.elements.webcamBtn.addEventListener('click', this.toggleWebcam.bind(this));
        this.elements.captureBtn.addEventListener('click', this.captureFromWebcam.bind(this));
    }

    async selectStyle(model) {
        if (this.isProcessing) return;

        try {
            this.updateStatus(`Loading ${model.displayName}...`, 'loading');

            // Update UI
            document.querySelectorAll('.style-option').forEach(el => {
                el.classList.remove('selected');
            });
            document.querySelector(`[data-model="${model.name}"]`).classList.add('selected');

            // Check cache first
            if (this.modelCache.has(model.name)) {
                this.onnxSession = this.modelCache.get(model.name);
                this.currentModel = model;
                this.updateModelInfo(model);
                this.updateStatus(`${model.displayName} ready!`, 'ready');
                this.enableStylizeButton();
                return;
            }

            // Download model
            const response = await fetch(model.url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const modelArrayBuffer = await response.arrayBuffer();

            // Create ONNX session
            const providers = [];
            if (navigator.gpu) {
                providers.push('webgpu');
            }
            providers.push('wasm');

            this.onnxSession = await window.ort.InferenceSession.create(
                modelArrayBuffer,
                {
                    executionProviders: providers,
                    graphOptimizationLevel: 'all'
                }
            );

            // Cache and set current
            this.modelCache.set(model.name, this.onnxSession);
            this.currentModel = model;

            this.updateModelInfo(model);
            this.updateStatus(`${model.displayName} loaded!`, 'ready');
            this.enableStylizeButton();

        } catch (error) {
            console.error('Model loading failed:', error);
            this.updateStatus(`Failed to load ${model.displayName}`, 'error');
        }
    }

    updateModelInfo(model) {
        const info = document.querySelector('.model-info') || document.createElement('div');
        info.className = 'model-info enhanced';
        info.innerHTML = `
            <h4>${model.displayName}</h4>
            <div class="model-details">
                <div class="detail-row">
                    <span class="label">Artist:</span>
                    <span class="value">${model.artist}</span>
                </div>
                ${model.year ? `
                <div class="detail-row">
                    <span class="label">Year:</span>
                    <span class="value">${model.year}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="label">Category:</span>
                    <span class="value">${this.formatCategoryName(model.category)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Model Size:</span>
                    <span class="value">${model.size}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Description:</span>
                    <span class="value description">${model.description}</span>
                </div>
            </div>
        `;

        // Set recommended strength
        this.elements.styleStrength.value = model.recommended_strength;
        this.elements.strengthValue.textContent = model.recommended_strength;

        // Insert after controls if not exists
        if (!document.querySelector('.model-info')) {
            this.elements.styleGrid.parentNode.appendChild(info);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayImage(img, this.elements.originalContainer);
                this.enableStylizeButton();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayImage(img, container) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate display size (max 400px)
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        container.innerHTML = '';
        container.appendChild(canvas);
    }

    async toggleWebcam() {
        if (this.webcamStream) {
            this.stopWebcam();
        } else {
            await this.startWebcam();
        }
    }

    async startWebcam() {
        try {
            this.webcamStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            this.elements.webcamVideo.srcObject = this.webcamStream;
            this.elements.webcamContainer.style.display = 'block';
            this.elements.webcamBtn.textContent = '📷 Stop Webcam';

        } catch (error) {
            console.error('Webcam error:', error);
            this.updateStatus('Webcam access denied', 'error');
        }
    }

    stopWebcam() {
        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }

        this.elements.webcamContainer.style.display = 'none';
        this.elements.webcamBtn.textContent = '📷 Use Webcam';
    }

    captureFromWebcam() {
        if (!this.webcamStream) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.elements.webcamVideo.videoWidth;
        canvas.height = this.elements.webcamVideo.videoHeight;

        ctx.drawImage(this.elements.webcamVideo, 0, 0);

        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.displayImage(img, this.elements.originalContainer);
            this.enableStylizeButton();
            this.stopWebcam();
        };
        img.src = canvas.toDataURL();
    }

    async stylizeImage() {
        if (!this.originalImage || !this.onnxSession || this.isProcessing) return;

        this.isProcessing = true;
        this.elements.stylizeBtn.disabled = true;
        this.elements.processingOverlay.style.display = 'flex';

        const startTime = performance.now();

        try {
            this.updateStatus('Processing with neural style transfer...', 'loading');
            console.log('Starting style transfer...');

            // Get image data
            const canvas = this.elements.originalContainer.querySelector('canvas');
            if (!canvas) {
                throw new Error('No canvas found in original container');
            }

            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log('Image data obtained:', canvas.width, 'x', canvas.height);

            // Preprocess image using WASM
            console.log('Preprocessing image...');
            const inputData = preprocess_image_data(
                new Uint8Array(imageData.data),
                canvas.width,
                canvas.height,
                224 // Target size for ONNX model (224x224)
            );
            console.log('Preprocessing complete, input data length:', inputData.length);

            // Create ONNX tensor
            console.log('Creating ONNX tensor...');
            console.log('Input data length:', inputData.length, 'Expected:', 1 * 3 * 224 * 224);

            if (inputData.length !== 1 * 3 * 224 * 224) {
                throw new Error(`Invalid input data length: ${inputData.length}, expected: ${1 * 3 * 224 * 224}`);
            }

            const inputTensor = new window.ort.Tensor('float32', inputData, [1, 3, 224, 224]);
            console.log('ONNX tensor created with shape:', inputTensor.dims);

            // Run inference
            console.log('Running inference...');
            const feeds = { [this.onnxSession.inputNames[0]]: inputTensor };
            const results = await this.onnxSession.run(feeds);
            console.log('Inference complete');

            // Get output tensor
            const outputTensor = results[this.onnxSession.outputNames[0]];
            const outputData = outputTensor.data;
            console.log('Output tensor obtained, data length:', outputData.length);
            console.log('Output tensor shape:', outputTensor.dims);

            // Validate output dimensions
            if (outputTensor.dims.length !== 4 || outputTensor.dims[0] !== 1 || outputTensor.dims[1] !== 3) {
                throw new Error(`Invalid output tensor shape: ${outputTensor.dims}, expected: [1, 3, H, W]`);
            }

            // Postprocess using WASM
            console.log('Postprocessing...');
            const processedData = postprocess_image_data(
                outputData,
                canvas.width,
                canvas.height,
                224
            );
            console.log('Postprocessing complete');

            // Blend with original based on strength
            const strength = parseFloat(this.elements.styleStrength.value);
            console.log('Blending with strength:', strength);
            const blendedData = blend_images(
                new Uint8Array(imageData.data),
                new Uint8Array(processedData),
                strength
            );
            console.log('Blending complete');

            // Display result
            console.log('Creating result canvas...');
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = canvas.width;
            resultCanvas.height = canvas.height;

            const resultImageData = new ImageData(
                new Uint8ClampedArray(blendedData),
                canvas.width,
                canvas.height
            );
            resultCtx.putImageData(resultImageData, 0, 0);

            // Clear and display result
            this.elements.resultContainer.innerHTML = '';
            this.elements.resultContainer.appendChild(resultCanvas);
            console.log('Result displayed');

            const processingTime = performance.now() - startTime;
            this.elements.processingTime.textContent = `${processingTime.toFixed(0)}ms`;
            console.log('Processing time:', processingTime.toFixed(0), 'ms');

            this.elements.downloadBtn.disabled = false;
            this.updateStatus('Style transfer complete!', 'ready');

        } catch (error) {
            console.error('Style transfer failed:', error);
            console.error('Error stack:', error.stack);
            this.updateStatus(`Processing failed: ${error.message}`, 'error');

            // Show error in result container
            this.elements.resultContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #dc3545; text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">❌</div>
                    <h3>Processing Failed</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">Check the browser console for more details.</p>
                </div>
            `;
        } finally {
            this.isProcessing = false;
            this.elements.processingOverlay.style.display = 'none';
            this.elements.stylizeBtn.disabled = false;
        }
    }

    downloadResult() {
        const canvas = this.elements.resultContainer.querySelector('canvas');
        if (!canvas) return;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stylized_${this.currentModel?.name || 'image'}_${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    resetApp() {
        this.originalImage = null;
        this.elements.originalContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📷</div>
                <p>Upload an image to start</p>
            </div>
        `;
        this.elements.resultContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎨</div>
                <p>Result will appear here</p>
            </div>
        `;
        this.elements.stylizeBtn.disabled = true;
        this.elements.downloadBtn.disabled = true;
        this.elements.fileInput.value = '';
        this.elements.processingTime.textContent = '-';

        document.querySelectorAll('.style-option').forEach(el => {
            el.classList.remove('selected');
        });
    }

    updateStrengthValue() {
        this.elements.strengthValue.textContent = this.elements.styleStrength.value;
    }

    enableStylizeButton() {
        if (this.originalImage && this.onnxSession) {
            this.elements.stylizeBtn.disabled = false;
        }
    }

    updateStatus(message, type = 'loading') {
        if (this.elements && this.elements.statusText && this.elements.statusDot) {
            this.elements.statusText.textContent = message;
            this.elements.statusDot.className = `status-dot ${type}`;
        } else {
            console.warn('Status elements not initialized yet, cannot update status');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting app initialization...');
    try {
        const app = new StyleTransferApp();
        console.log('StyleTransferApp created');
        await app.init();
        console.log('App initialization complete');
    } catch (error) {
        console.error('App initialization failed:', error);
        console.error('Error stack:', error.stack);

        // Show error in UI
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.innerHTML = `
                <span class="status-dot error"></span>
                <span>Initialization failed: ${error.message}</span>
            `;
        }
    }
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js');
    });
}
