use wasm_bindgen::prelude::*;

pub struct ImageFilters;

impl ImageFilters {
    /// Apply Gaussian blur
    pub fn gaussian_blur(data: &mut [u8], width: u32, height: u32, radius: f32) {
        let kernel = Self::create_gaussian_kernel(radius);
        let kernel_size = kernel.len();
        let half_kernel = kernel_size / 2;
        
        let mut temp = data.to_vec();
        
        // Horizontal pass
        for y in 0..height as usize {
            for x in 0..width as usize {
                for c in 0..3 { // RGB channels only
                    let mut sum = 0.0;
                    let mut weight_sum = 0.0;
                    
                    for k in 0..kernel_size {
                        let px = x as i32 + k as i32 - half_kernel as i32;
                        if px >= 0 && px < width as i32 {
                            let idx = (y * width as usize + px as usize) * 4 + c;
                            sum += data[idx] as f32 * kernel[k];
                            weight_sum += kernel[k];
                        }
                    }
                    
                    let idx = (y * width as usize + x) * 4 + c;
                    temp[idx] = (sum / weight_sum) as u8;
                }
            }
        }
        
        // Vertical pass
        for y in 0..height as usize {
            for x in 0..width as usize {
                for c in 0..3 {
                    let mut sum = 0.0;
                    let mut weight_sum = 0.0;
                    
                    for k in 0..kernel_size {
                        let py = y as i32 + k as i32 - half_kernel as i32;
                        if py >= 0 && py < height as i32 {
                            let idx = (py as usize * width as usize + x) * 4 + c;
                            sum += temp[idx] as f32 * kernel[k];
                            weight_sum += kernel[k];
                        }
                    }
                    
                    let idx = (y * width as usize + x) * 4 + c;
                    data[idx] = (sum / weight_sum) as u8;
                }
            }
        }
    }
    
    /// Create Gaussian kernel
    fn create_gaussian_kernel(radius: f32) -> Vec<f32> {
        let size = (radius * 6.0) as usize + 1;
        let mut kernel = vec![0.0; size];
        let sigma = radius / 3.0;
        let two_sigma_sq = 2.0 * sigma * sigma;
        let center = size / 2;
        
        let mut sum = 0.0;
        for i in 0..size {
            let x = i as f32 - center as f32;
            kernel[i] = (-x * x / two_sigma_sq).exp();
            sum += kernel[i];
        }
        
        // Normalize
        for i in 0..size {
            kernel[i] /= sum;
        }
        
        kernel
    }
    
    /// Apply edge detection (Sobel operator)
    pub fn edge_detection(data: &[u8], width: u32, height: u32) -> Vec<u8> {
        let mut result = vec![0u8; data.len()];
        
        let sobel_x = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        let sobel_y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        
        for y in 1..height as usize - 1 {
            for x in 1..width as usize - 1 {
                let mut gx = 0.0;
                let mut gy = 0.0;
                
                for ky in 0..3 {
                    for kx in 0..3 {
                        let px = x + kx - 1;
                        let py = y + ky - 1;
                        let idx = (py * width as usize + px) * 4;
                        
                        // Convert to grayscale
                        let gray = 0.299 * data[idx] as f32 + 
                                 0.587 * data[idx + 1] as f32 + 
                                 0.114 * data[idx + 2] as f32;
                        
                        let k_idx = ky * 3 + kx;
                        gx += gray * sobel_x[k_idx] as f32;
                        gy += gray * sobel_y[k_idx] as f32;
                    }
                }
                
                let magnitude = (gx * gx + gy * gy).sqrt().min(255.0) as u8;
                let out_idx = (y * width as usize + x) * 4;
                
                result[out_idx] = magnitude;     // R
                result[out_idx + 1] = magnitude; // G
                result[out_idx + 2] = magnitude; // B
                result[out_idx + 3] = 255;       // A
            }
        }
        
        result
    }
    
    /// Apply color space conversion (RGB to YUV)
    pub fn rgb_to_yuv(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
        let rf = r as f32 / 255.0;
        let gf = g as f32 / 255.0;
        let bf = b as f32 / 255.0;
        
        let y = 0.299 * rf + 0.587 * gf + 0.114 * bf;
        let u = -0.14713 * rf - 0.28886 * gf + 0.436 * bf;
        let v = 0.615 * rf - 0.51499 * gf - 0.10001 * bf;
        
        (y, u, v)
    }
    
    /// Apply color space conversion (YUV to RGB)
    pub fn yuv_to_rgb(y: f32, u: f32, v: f32) -> (u8, u8, u8) {
        let r = (y + 1.13983 * v).clamp(0.0, 1.0);
        let g = (y - 0.39465 * u - 0.58060 * v).clamp(0.0, 1.0);
        let b = (y + 2.03211 * u).clamp(0.0, 1.0);
        
        ((r * 255.0) as u8, (g * 255.0) as u8, (b * 255.0) as u8)
    }
}
