use wasm_bindgen::prelude::*;
use ndarray::Array4;

pub struct ImageProcessor;

impl ImageProcessor {
    pub fn new() -> Self {
        Self
    }

    pub fn preprocess_image(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        target_size: usize,
    ) -> Result<Vec<f32>, JsValue> {
        let mut processed = Vec::with_capacity(target_size * target_size * 3);
        
        // Convert RGBA to RGB and resize to target size
        let scale_x = width as f32 / target_size as f32;
        let scale_y = height as f32 / target_size as f32;

        for y in 0..target_size {
            for x in 0..target_size {
                let src_x = (x as f32 * scale_x) as u32;
                let src_y = (y as f32 * scale_y) as u32;
                
                let src_idx = ((src_y * width + src_x) * 4) as usize;
                
                if src_idx + 2 < image_data.len() {
                    // Normalize to [-1, 1] range for neural network
                    let r = (image_data[src_idx] as f32 / 255.0) * 2.0 - 1.0;
                    let g = (image_data[src_idx + 1] as f32 / 255.0) * 2.0 - 1.0;
                    let b = (image_data[src_idx + 2] as f32 / 255.0) * 2.0 - 1.0;
                    
                    processed.push(r);
                    processed.push(g);
                    processed.push(b);
                } else {
                    // Handle edge case with padding
                    processed.push(0.0);
                    processed.push(0.0);
                    processed.push(0.0);
                }
            }
        }

        // Reorganize from HWC to CHW format
        let mut chw_data = vec![0.0; target_size * target_size * 3];
        let hw_size = target_size * target_size;
        
        for i in 0..(target_size * target_size) {
            chw_data[i] = processed[i * 3];                    // R channel
            chw_data[i + hw_size] = processed[i * 3 + 1];      // G channel  
            chw_data[i + 2 * hw_size] = processed[i * 3 + 2];  // B channel
        }

        Ok(chw_data)
    }

    pub fn postprocess_image(
        &self,
        output_tensor: &Array4<f32>,
        target_width: u32,
        target_height: u32,
    ) -> Result<Vec<u8>, JsValue> {
        let shape = output_tensor.shape();
        if shape.len() != 4 || shape[0] != 1 || shape[1] != 3 {
            return Err(JsValue::from_str("Invalid output tensor shape"));
        }

        let model_size = shape[2];
        let mut result = Vec::with_capacity((target_width * target_height * 4) as usize);

        // Scale factors for resizing
        let scale_x = model_size as f32 / target_width as f32;
        let scale_y = model_size as f32 / target_height as f32;

        for y in 0..target_height {
            for x in 0..target_width {
                let src_x = (x as f32 * scale_x) as usize;
                let src_y = (y as f32 * scale_y) as usize;

                if src_x < model_size && src_y < model_size {
                    // Get RGB values from CHW tensor format
                    let r_val = output_tensor[[0, 0, src_y, src_x]];
                    let g_val = output_tensor[[0, 1, src_y, src_x]];
                    let b_val = output_tensor[[0, 2, src_y, src_x]];

                    // Convert from [-1, 1] range back to [0, 255]
                    let r = ((r_val + 1.0) * 127.5).clamp(0.0, 255.0) as u8;
                    let g = ((g_val + 1.0) * 127.5).clamp(0.0, 255.0) as u8;
                    let b = ((b_val + 1.0) * 127.5).clamp(0.0, 255.0) as u8;
                    let a = 255u8;

                    result.extend_from_slice(&[r, g, b, a]);
                } else {
                    // Padding for out-of-bounds
                    result.extend_from_slice(&[0, 0, 0, 255]);
                }
            }
        }

        Ok(result)
    }

    pub fn blend_images(
        &self,
        original: &[u8],
        stylized: &[u8],
        width: u32,
        height: u32,
        strength: f32,
    ) -> Result<Vec<u8>, JsValue> {
        if original.len() != stylized.len() {
            return Err(JsValue::from_str("Image sizes don't match"));
        }

        let mut result = Vec::with_capacity(original.len());
        let strength = strength.clamp(0.0, 1.0);

        for i in (0..original.len()).step_by(4) {
            if i + 3 < original.len() {
                let orig_r = original[i] as f32;
                let orig_g = original[i + 1] as f32;
                let orig_b = original[i + 2] as f32;

                let style_r = stylized[i] as f32;
                let style_g = stylized[i + 1] as f32;
                let style_b = stylized[i + 2] as f32;

                // Linear interpolation between original and stylized
                let blended_r = (orig_r * (1.0 - strength) + style_r * strength) as u8;
                let blended_g = (orig_g * (1.0 - strength) + style_g * strength) as u8;
                let blended_b = (orig_b * (1.0 - strength) + style_b * strength) as u8;

                result.extend_from_slice(&[blended_r, blended_g, blended_b, 255]);
            }
        }

        Ok(result)
    }
}
