/**
 * Batch Image Processing for Neural Style Transfer
 * Handles multiple image processing with progress tracking and batch download
 */

class BatchProcessor {
    constructor(app) {
        this.app = app;
        this.queue = [];
        this.results = [];
        this.isProcessing = false;
        this.currentIndex = 0;
        this.progressCallback = null;
        this.completionCallback = null;
    }

    /**
     * Add images to the processing queue
     * @param {FileList} files - Image files to process
     * @param {string} styleName - Style to apply to all images
     * @param {number} strength - Style strength (0-1)
     */
    addToQueue(files, styleName, strength = 0.8) {
        const fileArray = Array.from(files);
        
        fileArray.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.queue.push({
                    file: file,
                    styleName: styleName,
                    strength: strength,
                    id: Date.now() + Math.random(),
                    status: 'pending'
                });
            }
        });

        console.log(`Added ${fileArray.length} images to batch queue`);
        return this.queue.length;
    }

    /**
     * Start processing the queue
     * @param {Function} progressCallback - Called with progress updates
     * @param {Function} completionCallback - Called when all processing is complete
     */
    async startProcessing(progressCallback, completionCallback) {
        if (this.isProcessing) {
            throw new Error('Batch processing already in progress');
        }

        if (this.queue.length === 0) {
            throw new Error('No images in queue');
        }

        this.isProcessing = true;
        this.currentIndex = 0;
        this.results = [];
        this.progressCallback = progressCallback;
        this.completionCallback = completionCallback;

        console.log(`Starting batch processing of ${this.queue.length} images`);

        try {
            // Process each image in the queue
            for (let i = 0; i < this.queue.length; i++) {
                this.currentIndex = i;
                const item = this.queue[i];
                
                // Update progress
                this.updateProgress(i, this.queue.length, `Processing ${item.file.name}...`);
                
                try {
                    // Process the image
                    const result = await this.processImage(item);
                    this.results.push(result);
                    item.status = 'completed';
                    
                } catch (error) {
                    console.error(`Error processing ${item.file.name}:`, error);
                    item.status = 'failed';
                    item.error = error.message;
                    
                    this.results.push({
                        id: item.id,
                        fileName: item.file.name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            // Processing complete
            this.isProcessing = false;
            this.updateProgress(this.queue.length, this.queue.length, 'Batch processing complete!');
            
            if (this.completionCallback) {
                this.completionCallback(this.results);
            }

        } catch (error) {
            this.isProcessing = false;
            console.error('Batch processing failed:', error);
            throw error;
        }
    }

    /**
     * Process a single image
     * @param {Object} item - Queue item with file, styleName, strength
     * @returns {Object} Processing result
     */
    async processImage(item) {
        const { file, styleName, strength } = item;
        
        // Create image element
        const img = new Image();
        const imageData = await this.fileToImageData(file);
        
        // Apply style transfer
        const styledImageData = await this.app.applyStyleTransfer(imageData, styleName, strength);
        
        // Convert back to blob for download
        const blob = await this.imageDataToBlob(styledImageData);
        
        return {
            id: item.id,
            fileName: file.name,
            originalFile: file,
            styledBlob: blob,
            styleName: styleName,
            strength: strength,
            status: 'completed',
            processedAt: new Date().toISOString()
        };
    }

    /**
     * Convert file to image data
     * @param {File} file - Image file
     * @returns {ImageData} Image data
     */
    fileToImageData(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };
            
            img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Convert image data to blob
     * @param {ImageData} imageData - Image data
     * @returns {Blob} Image blob
     */
    imageDataToBlob(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            ctx.putImageData(imageData, 0, 0);
            
            canvas.toBlob(resolve, 'image/png');
        });
    }

    /**
     * Update progress callback
     * @param {number} current - Current item index
     * @param {number} total - Total items
     * @param {string} message - Progress message
     */
    updateProgress(current, total, message) {
        const progress = {
            current: current + 1,
            total: total,
            percentage: Math.round(((current + 1) / total) * 100),
            message: message,
            isComplete: current + 1 === total
        };

        if (this.progressCallback) {
            this.progressCallback(progress);
        }
    }

    /**
     * Download all processed images as a ZIP file
     */
    async downloadAll() {
        if (this.results.length === 0) {
            throw new Error('No processed images to download');
        }

        // For now, download individual files
        // In a real implementation, you'd use a ZIP library like JSZip
        this.results.forEach((result, index) => {
            if (result.status === 'completed') {
                this.downloadFile(result.styledBlob, `styled_${result.fileName}`);
            }
        });
    }

    /**
     * Download a single file
     * @param {Blob} blob - File blob
     * @param {string} filename - Filename
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Clear the processing queue
     */
    clearQueue() {
        this.queue = [];
        this.results = [];
        this.currentIndex = 0;
    }

    /**
     * Get queue status
     * @returns {Object} Queue status information
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            resultsLength: this.results.length,
            isProcessing: this.isProcessing,
            currentIndex: this.currentIndex,
            completed: this.results.filter(r => r.status === 'completed').length,
            failed: this.results.filter(r => r.status === 'failed').length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BatchProcessor;
}
