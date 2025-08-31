/**
 * Image Preprocessor for Neural Style Transfer
 * Ensures uploaded images are compatible with ONNX models
 * Handles resizing, normalization, and format conversion
 */

class ImagePreprocessor {
    constructor() {
        this.targetSize = 512; // ONNX model input size
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
    }

    /**
     * Main preprocessing function - converts any image to model-compatible format
     * @param {File|HTMLImageElement|HTMLCanvasElement} input - Input image source
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Preprocessed image data and metadata
     */
    async preprocessImage(input, options = {}) {
        try {
            console.log('🔄 Starting image preprocessing...');
            
            // Parse options with defaults
            const config = {
                targetSize: options.targetSize || this.targetSize,
                maintainAspectRatio: options.maintainAspectRatio !== false,
                quality: options.quality || 0.9,
                normalize: options.normalize !== false,
                ...options
            };

            console.log('⚙️  Processing config:', config);

            // Step 1: Load and validate input
            const imageData = await this.loadImage(input);
            console.log('📸 Image loaded:', {
                width: imageData.width,
                height: imageData.height,
                channels: imageData.data.length / (imageData.width * imageData.height)
            });

            // Step 2: Resize to target dimensions
            const resizedData = await this.resizeImage(imageData, config);
            console.log('📏 Resized to:', {
                width: resizedData.width,
                height: resizedData.height
            });

            // Step 3: Normalize pixel values if requested
            let finalData = resizedData;
            if (config.normalize) {
                finalData = this.normalizePixels(resizedData);
                console.log('🎯 Pixel values normalized');
            }

            // Step 4: Prepare output formats
            const result = {
                imageData: finalData,
                canvas: this.createCanvas(finalData),
                metadata: {
                    originalSize: { width: imageData.width, height: imageData.height },
                    processedSize: { width: finalData.width, height: finalData.height },
                    aspectRatio: finalData.width / finalData.height,
                    pixelCount: finalData.width * finalData.height,
                    dataLength: finalData.data.length,
                    timestamp: Date.now()
                }
            };

            console.log('✅ Image preprocessing completed successfully');
            console.log('📊 Final metadata:', result.metadata);
            
            return result;

        } catch (error) {
            console.error('❌ Image preprocessing failed:', error);
            throw new Error(`Image preprocessing failed: ${error.message}`);
        }
    }

    /**
     * Load image from various input types
     * @param {File|HTMLImageElement|HTMLCanvasElement} input
     * @returns {Promise<ImageData>}
     */
    async loadImage(input) {
        if (input instanceof File) {
            return await this.loadFromFile(input);
        } else if (input instanceof HTMLImageElement) {
            return await this.loadFromImageElement(input);
        } else if (input instanceof HTMLCanvasElement) {
            return this.loadFromCanvas(input);
        } else {
            throw new Error('Unsupported input type. Use File, HTMLImageElement, or HTMLCanvasElement');
        }
    }

    /**
     * Load image from File object
     * @param {File} file
     * @returns {Promise<ImageData>}
     */
    async loadFromFile(file) {
        // Validate file
        if (!this.supportedFormats.includes(file.type)) {
            throw new Error(`Unsupported file format: ${file.type}. Supported: ${this.supportedFormats.join(', ')}`);
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${this.maxFileSize / 1024 / 1024}MB`);
        }

        console.log('📁 Loading from file:', {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + 'KB',
            type: file.type
        });

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    resolve(imageData);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image file'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Load image from HTMLImageElement
     * @param {HTMLImageElement} img
     * @returns {Promise<ImageData>}
     */
    async loadFromImageElement(img) {
        if (!img.complete) {
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Image failed to load'));
            });
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Load image from HTMLCanvasElement
     * @param {HTMLCanvasElement} canvas
     * @returns {ImageData}
     */
    loadFromCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Resize image to target dimensions
     * @param {ImageData} imageData
     * @param {Object} config
     * @returns {Promise<ImageData>}
     */
    async resizeImage(imageData, config) {
        const { targetSize, maintainAspectRatio } = config;
        
        let targetWidth, targetHeight;
        
        if (maintainAspectRatio) {
            const aspectRatio = imageData.width / imageData.height;
            if (aspectRatio > 1) {
                // Landscape
                targetWidth = targetSize;
                targetHeight = Math.round(targetSize / aspectRatio);
            } else {
                // Portrait or square
                targetHeight = targetSize;
                targetWidth = Math.round(targetSize * aspectRatio);
            }
        } else {
            targetWidth = targetHeight = targetSize;
        }

        console.log('📐 Resizing:', {
            from: `${imageData.width}x${imageData.height}`,
            to: `${targetWidth}x${targetHeight}`,
            maintainAspectRatio
        });

        // Use high-quality canvas resizing
        const sourceCanvas = document.createElement('canvas');
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCanvas.width = imageData.width;
        sourceCanvas.height = imageData.height;
        sourceCtx.putImageData(imageData, 0, 0);

        const targetCanvas = document.createElement('canvas');
        const targetCtx = targetCanvas.getContext('2d');
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;

        // Enable high-quality image smoothing
        targetCtx.imageSmoothingEnabled = true;
        targetCtx.imageSmoothingQuality = 'high';

        // Draw with proper scaling
        targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

        return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
    }

    /**
     * Normalize pixel values for ONNX models
     * @param {ImageData} imageData
     * @returns {ImageData}
     */
    normalizePixels(imageData) {
        const normalizedData = new Uint8ClampedArray(imageData.data.length);
        
        // ONNX model normalization parameters
        const mean = [0.485, 0.456, 0.406]; // ImageNet mean
        const std = [0.229, 0.224, 0.225];  // ImageNet std
        const scale = 255.0;

        for (let i = 0; i < imageData.data.length; i += 4) {
            // Normalize RGB values (skip alpha)
            for (let c = 0; c < 3; c++) {
                const pixelValue = imageData.data[i + c] / scale;
                const normalized = (pixelValue - mean[c]) / std[c];
                // Convert back to 0-255 range for display
                normalizedData[i + c] = Math.max(0, Math.min(255, Math.round(normalized * 255)));
            }
            // Preserve alpha channel
            normalizedData[i + 3] = imageData.data[i + 3];
        }

        return new ImageData(normalizedData, imageData.width, imageData.height);
    }

    /**
     * Create canvas from ImageData
     * @param {ImageData} imageData
     * @returns {HTMLCanvasElement}
     */
    createCanvas(imageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Convert ImageData to Uint8Array for WASM
     * @param {ImageData} imageData
     * @returns {Uint8Array}
     */
    toUint8Array(imageData) {
        return new Uint8Array(imageData.data.buffer);
    }

    /**
     * Create a preview thumbnail
     * @param {ImageData} imageData
     * @param {number} maxSize - Maximum dimension for thumbnail
     * @returns {HTMLCanvasElement}
     */
    createThumbnail(imageData, maxSize = 150) {
        const aspectRatio = imageData.width / imageData.height;
        let thumbWidth, thumbHeight;
        
        if (aspectRatio > 1) {
            thumbWidth = maxSize;
            thumbHeight = Math.round(maxSize / aspectRatio);
        } else {
            thumbHeight = maxSize;
            thumbWidth = Math.round(maxSize * aspectRatio);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        // Create temporary canvas for resizing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);

        // Draw resized thumbnail
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, thumbWidth, thumbHeight);

        return canvas;
    }

    /**
     * Validate image dimensions and data
     * @param {ImageData} imageData
     * @returns {Object} - Validation result
     */
    validateImageData(imageData) {
        const issues = [];
        const warnings = [];

        // Check dimensions
        if (imageData.width <= 0 || imageData.height <= 0) {
            issues.push('Invalid dimensions');
        }

        if (imageData.width > 4096 || imageData.height > 4096) {
            warnings.push('Very large image - may cause performance issues');
        }

        // Check data length
        const expectedLength = imageData.width * imageData.height * 4;
        if (imageData.data.length !== expectedLength) {
            issues.push(`Data length mismatch: expected ${expectedLength}, got ${imageData.data.length}`);
        }

        // Check for completely transparent images
        let hasVisiblePixels = false;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 0) {
                hasVisiblePixels = true;
                break;
            }
        }
        if (!hasVisiblePixels) {
            warnings.push('Image appears to be completely transparent');
        }

        return {
            isValid: issues.length === 0,
            issues,
            warnings,
            dimensions: { width: imageData.width, height: imageData.height },
            dataLength: imageData.data.length
        };
    }

    /**
     * Get image statistics for debugging
     * @param {ImageData} imageData
     * @returns {Object} - Image statistics
     */
    getImageStats(imageData) {
        const data = imageData.data;
        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        let sumR = 0, sumG = 0, sumB = 0;
        let transparentPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // RGB ranges
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minG = Math.min(minG, g);
            maxG = Math.max(maxG, g);
            minB = Math.min(minB, b);
            maxB = Math.max(maxB, b);

            // RGB sums
            sumR += r;
            sumG += g;
            sumB += b;

            // Alpha check
            if (a < 255) transparentPixels++;
        }

        const pixelCount = data.length / 4;
        const avgR = sumR / pixelCount;
        const avgG = sumG / pixelCount;
        const avgB = sumB / pixelCount;

        return {
            dimensions: { width: imageData.width, height: imageData.height },
            pixelCount,
            rgbRanges: {
                red: { min: minR, max: maxR, average: Math.round(avgR) },
                green: { min: minG, max: maxG, average: Math.round(avgG) },
                blue: { min: minB, max: maxB, average: Math.round(avgB) }
            },
            transparency: {
                transparentPixels,
                transparencyPercentage: (transparentPixels / pixelCount * 100).toFixed(2)
            },
            dataSize: {
                bytes: data.length,
                megabytes: (data.length / 1024 / 1024).toFixed(3)
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImagePreprocessor;
} else if (typeof window !== 'undefined') {
    window.ImagePreprocessor = ImagePreprocessor;
}
