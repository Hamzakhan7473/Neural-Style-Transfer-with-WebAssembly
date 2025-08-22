use wasm_bindgen::prelude::*;
use std::collections::HashMap;
use crate::models::StyleModel;
use crate::gpu::GpuContext;

#[wasm_bindgen]
pub struct StyleTransferEngine {
    gpu_context: Option<GpuContext>,
    models: HashMap<String, StyleModel>,
    initialized: bool,
}

#[wasm_bindgen]
impl StyleTransferEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StyleTransferEngine {
        Self {
            gpu_context: None,
            models: HashMap::new(),
            initialized: false,
        }
    }

    #[wasm_bindgen]
    pub async fn initialize(&mut self) -> Result<(), JsValue> {
        self.gpu_context = Some(GpuContext::new().await?);
        self.initialized = true;
        Ok(())
    }

    #[wasm_bindgen]
    pub fn is_ready(&self) -> bool {
        self.initialized && self.gpu_context.is_some()
    }

    #[wasm_bindgen]
    pub async fn load_style(&mut self, style_name: &str) -> Result<(), JsValue> {
        let model = StyleModel::load(style_name).await?;
        self.models.insert(style_name.to_string(), model);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_loaded_styles(&self) -> Vec<String> {
        self.models.keys().cloned().collect()
    }

    #[wasm_bindgen]
    pub async fn transfer_style(
        &self,
        image_data: Vec<u8>,
        style_name: &str,
        progress_callback: js_sys::Function,
    ) -> Result<Vec<u8>, JsValue> {
        if !self.initialized {
            return Err("Engine not initialized".into());
        }

        let model = self.models.get(style_name)
            .ok_or_else(|| JsValue::from_str("Style not loaded"))?;

        // Progress: 20%
        progress_callback.call1(&JsValue::NULL, &JsValue::from(20))?;

        // TODO: Implement actual style transfer with ONNX models
        // For now, we'll apply a simple color filter effect to simulate style transfer
        
        // Progress: 50%
        progress_callback.call1(&JsValue::NULL, &JsValue::from(50))?;
        
        // Apply a simple color transformation based on the style
        let mut processed_data = image_data.clone();
        
        match style_name {
            "van-gogh" => {
                // Increase blue and yellow tones
                for i in (0..processed_data.len()).step_by(4) {
                    if i + 2 < processed_data.len() {
                        processed_data[i] = processed_data[i].saturating_add(20);     // Red
                        processed_data[i + 1] = processed_data[i + 1].saturating_add(30); // Green
                        processed_data[i + 2] = processed_data[i + 2].saturating_add(40); // Blue
                    }
                }
            },
            "picasso" => {
                // Increase contrast and saturation
                for i in (0..processed_data.len()).step_by(4) {
                    if i + 2 < processed_data.len() {
                        processed_data[i] = (processed_data[i] as f32 * 1.3) as u8;     // Red
                        processed_data[i + 1] = (processed_data[i + 1] as f32 * 1.2) as u8; // Green
                        processed_data[i + 2] = (processed_data[i + 2] as f32 * 1.4) as u8; // Blue
                    }
                }
            },
            "cyberpunk" => {
                // Add neon green and purple tones
                for i in (0..processed_data.len()).step_by(4) {
                    if i + 2 < processed_data.len() {
                        processed_data[i] = processed_data[i].saturating_add(40);     // Red
                        processed_data[i + 1] = processed_data[i + 1].saturating_add(60); // Green
                        processed_data[i + 2] = processed_data[i + 2].saturating_add(30); // Blue
                    }
                }
            },
            "watercolor" => {
                // Soften colors and reduce saturation
                for i in (0..processed_data.len()).step_by(4) {
                    if i + 2 < processed_data.len() {
                        processed_data[i] = (processed_data[i] as f32 * 0.8) as u8;     // Red
                        processed_data[i + 1] = (processed_data[i + 1] as f32 * 0.9) as u8; // Green
                        processed_data[i + 2] = (processed_data[i + 2] as f32 * 0.85) as u8; // Blue
                    }
                }
            },
            "oil-painting" => {
                // Rich, warm tones
                for i in (0..processed_data.len()).step_by(4) {
                    if i + 2 < processed_data.len() {
                        processed_data[i] = (processed_data[i] as f32 * 1.2) as u8;     // Red
                        processed_data[i + 1] = (processed_data[i + 1] as f32 * 1.1) as u8; // Green
                        processed_data[i + 2] = (processed_data[i + 2] as f32 * 0.9) as u8; // Blue
                    }
                }
            },
            _ => {
                // Default: slight enhancement
                for i in (0..processed_data.len()).step_by(4) {
                    if i + 2 < processed_data.len() {
                        processed_data[i] = (processed_data[i] as f32 * 1.1) as u8;     // Red
                        processed_data[i + 1] = (processed_data[i + 1] as f32 * 1.1) as u8; // Green
                        processed_data[i + 2] = (processed_data[i + 2] as f32 * 1.1) as u8; // Blue
                    }
                }
            }
        }

        // Progress: 100%
        progress_callback.call1(&JsValue::NULL, &JsValue::from(100))?;
        
        Ok(processed_data)
    }
}
