use ndarray::{Array, Array4, Axis, Dimension};
use wasm_bindgen::prelude::*;

pub struct TensorOps;

impl TensorOps {
    /// Resize tensor using bilinear interpolation
    pub fn resize_tensor(
        input: &Array4<f32>, 
        new_height: usize, 
        new_width: usize
    ) -> Result<Array4<f32>, JsValue> {
        let (batch, channels, old_height, old_width) = input.dim();
        let mut output = Array4::<f32>::zeros((batch, channels, new_height, new_width));
        
        let height_scale = old_height as f32 / new_height as f32;
        let width_scale = old_width as f32 / new_width as f32;
        
        for b in 0..batch {
            for c in 0..channels {
                for h in 0..new_height {
                    for w in 0..new_width {
                        let src_h = h as f32 * height_scale;
                        let src_w = w as f32 * width_scale;
                        
                        let h0 = src_h.floor() as usize;
                        let w0 = src_w.floor() as usize;
                        let h1 = (h0 + 1).min(old_height - 1);
                        let w1 = (w0 + 1).min(old_width - 1);
                        
                        let dh = src_h - h0 as f32;
                        let dw = src_w - w0 as f32;
                        
                        // Bilinear interpolation
                        let val = input[[b, c, h0, w0]] * (1.0 - dh) * (1.0 - dw) +
                                input[[b, c, h1, w0]] * dh * (1.0 - dw) +
                                input[[b, c, h0, w1]] * (1.0 - dh) * dw +
                                input[[b, c, h1, w1]] * dh * dw;
                        
                        output[[b, c, h, w]] = val;
                    }
                }
            }
        }
        
        Ok(output)
    }
    
    /// Normalize tensor to [-1, 1] range
    pub fn normalize_tensor(input: &mut Array4<f32>) {
        let min_val = input.iter().fold(f32::INFINITY, |a, &b| a.min(b));
        let max_val = input.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        let range = max_val - min_val;
        
        if range > 0.0 {
            input.mapv_inplace(|x| (x - min_val) / range * 2.0 - 1.0);
        }
    }
    
    /// Denormalize tensor from [-1, 1] to [0, 255] range
    pub fn denormalize_tensor(input: &mut Array4<f32>) {
        input.mapv_inplace(|x| ((x + 1.0) * 127.5).clamp(0.0, 255.0));
    }
    
    /// Apply gram matrix for style loss computation
    pub fn gram_matrix(input: &Array4<f32>) -> Result<Array4<f32>, JsValue> {
        let (batch, channels, height, width) = input.dim();
        let features = height * width;
        
        let mut gram = Array4::<f32>::zeros((batch, channels, channels, 1));
        
        for b in 0..batch {
            for i in 0..channels {
                for j in 0..channels {
                    let mut sum = 0.0;
                    for h in 0..height {
                        for w in 0..width {
                            sum += input[[b, i, h, w]] * input[[b, j, h, w]];
                        }
                    }
                    gram[[b, i, j, 0]] = sum / features as f32;
                }
            }
        }
        
        Ok(gram)
    }
}
