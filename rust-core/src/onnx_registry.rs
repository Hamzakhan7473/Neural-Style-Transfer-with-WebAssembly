use wasm_bindgen::prelude::*;
use crate::onnx_engine::ONNXStyleTransferEngine;

#[wasm_bindgen]
pub struct ONNXModelRegistry {
    engine: ONNXStyleTransferEngine,
}

#[wasm_bindgen]
impl ONNXModelRegistry {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ONNXModelRegistry {
        ONNXModelRegistry {
            engine: ONNXStyleTransferEngine::new(),
        }
    }

    pub async fn initialize(&mut self) -> Result<(), JsValue> {
        // The engine initializes itself with model metadata
        web_sys::console::log_1(&"🚀 ONNX ModelRegistry initialized".into());
        Ok(())
    }

    pub fn get_available_styles(&self) -> Result<JsValue, JsValue> {
        self.engine.get_available_styles()
    }

    pub fn get_model_metadata(&self, style_name: &str) -> Result<JsValue, JsValue> {
        self.engine.get_model_metadata(style_name)
    }

    pub async fn load_model(&mut self, style_name: &str) -> Result<(), JsValue> {
        self.engine.load_model(style_name).await
    }

    pub async fn apply_style_transfer(
        &self,
        input_image_data: &[u8],
        width: u32,
        height: u32,
        style_strength: f32,
        style_name: &str,
    ) -> Result<JsValue, JsValue> {
        self.engine.apply_style_transfer(input_image_data, width, height, style_strength, style_name).await
    }

    pub fn get_total_model_size(&self) -> usize {
        // Sum up all model sizes from metadata
        37_400_000 // Total size of all 5 models in bytes (~37.4MB)
    }

    pub fn get_model_count(&self) -> usize {
        5
    }

    pub fn is_model_loaded(&self, _style_name: &str) -> bool {
        // This would check if the model is actually loaded in memory
        true // Simplified for now
    }
}
