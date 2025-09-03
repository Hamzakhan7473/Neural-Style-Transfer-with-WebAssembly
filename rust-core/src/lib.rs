use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello from Rust and WebAssembly!");
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Image processing utilities for WASM
#[wasm_bindgen]
pub fn preprocess_image_data(data: &[u8], width: u32, height: u32, target_size: u32) -> Vec<f32> {
    let mut result = Vec::new();
    
    // Calculate scaling factors
    let scale_x = width as f32 / target_size as f32;
    let scale_y = height as f32 / target_size as f32;
    
    // Resize and convert to float32 in CHW format
    for y in 0..target_size {
        for x in 0..target_size {
            let src_x = (x as f32 * scale_x) as u32;
            let src_y = (y as f32 * scale_y) as u32;
            
            if src_x < width && src_y < height {
                let idx = ((src_y * width + src_x) * 4) as usize;
                if idx + 2 < data.len() {
                    // Convert from [0, 255] to [0, 255] (keep original range for ONNX models)
                    let r = data[idx] as f32;
                    let g = data[idx + 1] as f32;  
                    let b = data[idx + 2] as f32;
                    
                    result.push(r);
                    result.push(g);
                    result.push(b);
                }
            } else {
                result.push(0.0);
                result.push(0.0);
                result.push(0.0);
            }
        }
    }
    
    // Convert from HWC to CHW format for ONNX
    let mut chw_data = vec![0.0; (target_size * target_size * 3) as usize];
    let hw_size = (target_size * target_size) as usize;
    
    for i in 0..(target_size * target_size) as usize {
        chw_data[i] = result[i * 3];                    // R channel
        chw_data[i + hw_size] = result[i * 3 + 1];      // G channel  
        chw_data[i + 2 * hw_size] = result[i * 3 + 2];  // B channel
    }
    
    chw_data
}

#[wasm_bindgen]
pub fn postprocess_image_data(
    data: &[f32], 
    original_width: u32, 
    original_height: u32,
    processed_size: u32
) -> Vec<u8> {
    let mut result = Vec::new();
    
    let scale_x = processed_size as f32 / original_width as f32;
    let scale_y = processed_size as f32 / original_height as f32;
    let hw_size = (processed_size * processed_size) as usize;
    
    for y in 0..original_height {
        for x in 0..original_width {
            let src_x = (x as f32 * scale_x) as u32;
            let src_y = (y as f32 * scale_y) as u32;
            
            if src_x < processed_size && src_y < processed_size {
                let idx = (src_y * processed_size + src_x) as usize;
                
                // Get RGB values from CHW format
                let r_val = data[idx];
                let g_val = data[idx + hw_size];
                let b_val = data[idx + 2 * hw_size];
                
                // Clamp values to [0, 255] range
                let r = r_val.clamp(0.0, 255.0) as u8;
                let g = g_val.clamp(0.0, 255.0) as u8;
                let b = b_val.clamp(0.0, 255.0) as u8;
                let a = 255u8;
                
                result.extend_from_slice(&[r, g, b, a]);
            } else {
                result.extend_from_slice(&[0, 0, 0, 255]);
            }
        }
    }
    
    result
}

#[wasm_bindgen]
pub fn blend_images(
    original: &[u8],
    stylized: &[u8], 
    strength: f32
) -> Vec<u8> {
    let mut result = Vec::with_capacity(original.len());
    let strength = strength.clamp(0.0, 1.0);
    
    for i in (0..original.len()).step_by(4) {
        if i + 3 < original.len() && i + 3 < stylized.len() {
            let orig_r = original[i] as f32;
            let orig_g = original[i + 1] as f32;
            let orig_b = original[i + 2] as f32;
            
            let style_r = stylized[i] as f32;
            let style_g = stylized[i + 1] as f32;
            let style_b = stylized[i + 2] as f32;
            
            let blended_r = (orig_r * (1.0 - strength) + style_r * strength) as u8;
            let blended_g = (orig_g * (1.0 - strength) + style_g * strength) as u8;
            let blended_b = (orig_b * (1.0 - strength) + style_b * strength) as u8;
            
            result.extend_from_slice(&[blended_r, blended_g, blended_b, 255]);
        }
    }
    
    result
}
