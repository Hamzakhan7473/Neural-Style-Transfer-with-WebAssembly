use crate::engine::{ModelMetadata, ONNXStyleTransferEngine};
use wasm_bindgen::prelude::*;

use js_sys;

#[wasm_bindgen]
pub struct ModelRegistry {
    models: Vec<String>,
    engine: ONNXStyleTransferEngine,
}

#[wasm_bindgen]
impl ModelRegistry {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ModelRegistry {
        let mut registry = ModelRegistry {
            models: Vec::new(),
            engine: ONNXStyleTransferEngine::new(),
        };
        
        // Initialize with default models
        registry.initialize_default_models();
        
        registry
    }

    fn initialize_default_models(&mut self) {
        // Van Gogh Style Model
        let van_gogh_metadata = ModelMetadata {
            name: "van-gogh".to_string(),
            size_bytes: 15_000_000, // 15MB
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "stylized_output".to_string(),
            recommended_resolution: (512, 512),
            style_description: "Impressionist style inspired by Van Gogh's Starry Night, featuring swirling brushstrokes, vibrant colors, and expressive texture".to_string(),
        };
        self.models.push("van-gogh".to_string());

        // Picasso Style Model
        let picasso_metadata = ModelMetadata {
            name: "picasso".to_string(),
            size_bytes: 18_000_000, // 18MB
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "stylized_output".to_string(),
            recommended_resolution: (512, 512),
            style_description: "Cubist abstraction inspired by Picasso's geometric forms, featuring angular shapes, fragmented perspectives, and bold color contrasts".to_string(),
        };
        self.models.push("picasso".to_string());

        // Cyberpunk Style Model
        let cyberpunk_metadata = ModelMetadata {
            name: "cyberpunk".to_string(),
            size_bytes: 20_000_000, // 20MB
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "stylized_output".to_string(),
            recommended_resolution: (512, 512),
            style_description: "Futuristic cyberpunk aesthetic with neon colors, digital glitch effects, and high-tech urban atmosphere".to_string(),
        };
        self.models.push("cyberpunk".to_string());

        // Watercolor Style Model
        let watercolor_metadata = ModelMetadata {
            name: "watercolor".to_string(),
            size_bytes: 12_000_000, // 12MB
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "stylized_output".to_string(),
            recommended_resolution: (512, 512),
            style_description: "Soft watercolor painting style with flowing colors, gentle blending, and translucent washes".to_string(),
        };
        self.models.push("watercolor".to_string());

        // Oil Painting Style Model
        let oil_painting_metadata = ModelMetadata {
            name: "oil-painting".to_string(),
            size_bytes: 22_000_000, // 22MB
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "stylized_output".to_string(),
            recommended_resolution: (512, 512),
            style_description: "Classical oil painting style with rich textures, deep colors, and traditional artistic techniques".to_string(),
        };
        self.models.push("oil-painting".to_string());
    }

    pub fn initialize(&mut self) -> Result<(), JsValue> {
        // Initialize the registry - this is called after construction
        // The models are already initialized in the constructor
        self.engine.initialize()?;
        Ok(())
    }

    pub fn get_available_styles(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.models)
            .map_err(|e| format!("Serialization failed: {}", e).into())
    }

    pub fn get_model_metadata(&self, style_name: &str) -> Result<JsValue, JsValue> {
        if self.models.contains(&style_name.to_string()) {
            Ok(serde_wasm_bindgen::to_value(&style_name)?)
        } else {
            Err(format!("Model '{}' not found", style_name).into())
        }
    }

    pub fn load_model(&mut self, style_name: &str) -> Result<(), JsValue> {
        if !self.models.contains(&style_name.to_string()) {
            return Err(format!("Style '{}' not available", style_name).into());
        }
        
        // Initialize the engine if needed
        self.engine.initialize()?;
        
        // Load the model
        self.engine.load_model(style_name)?;
        
        Ok(())
    }

    pub fn apply_style_transfer(
        &self,
        input_image_data: &[u8],
        _width: u32,
        _height: u32,
        style_strength: f32,
        style_name: &str,
    ) -> Result<JsValue, JsValue> {

        
        // Apply style transfer directly without callback
        
        // The engine's apply_style_transfer already returns a complete JsValue result
        self.engine.apply_style_transfer(input_image_data, 0, 0, style_strength, style_name)
    }

    pub fn get_total_model_size(&self) -> usize {
        self.models.len() * 15_000_000 // Approximate size per model
    }

    pub fn get_model_count(&self) -> usize {
        self.models.len()
    }

    pub fn is_model_loaded(&self, style_name: &str) -> bool {
        self.models.contains(&style_name.to_string())
    }
}

// ONNX Model Loading Functions
#[wasm_bindgen]
pub fn load_onnx_model_from_url(_style_name: &str, _model_url: &str) -> Result<Vec<u8>, JsValue> {
    // This would download the ONNX model from a URL
    // For now, return a placeholder
    let placeholder_model = vec![0u8; 1024]; // 1KB placeholder
    Ok(placeholder_model)
}

#[wasm_bindgen]
pub fn validate_onnx_model(model_data: &[u8]) -> Result<bool, JsValue> {
    // Basic ONNX model validation
    if model_data.len() < 100 {
        return Ok(false);
    }
    
    // Check for ONNX magic number (should start with "ONNX")
    if model_data.len() >= 4 {
        let magic = &model_data[0..4];
        if magic == b"ONNX" {
            return Ok(true);
        }
    }
    
    Ok(false)
}

#[wasm_bindgen]
pub fn get_model_info(model_data: &[u8]) -> Result<JsValue, JsValue> {
    let is_valid = validate_onnx_model(model_data)?;
    
    // Create a simple info object without serde_json
    let info = js_sys::Object::new();
    js_sys::Reflect::set(&info, &"size_bytes".into(), &(model_data.len() as u32).into())?;
    js_sys::Reflect::set(&info, &"is_valid".into(), &is_valid.into())?;
    js_sys::Reflect::set(&info, &"format".into(), &"ONNX".into())?;
    js_sys::Reflect::set(&info, &"compression".into(), &"None".into())?;
    
    Ok(info.into())
}
