use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub file_name: String,
    pub size_mb: f32,
    pub input_size: usize,
    pub input_name: String,
    pub output_name: String,
    pub recommended_strength: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelRegistryData {
    pub models: Vec<ModelInfo>,
}

pub struct ModelRegistry {
    models: HashMap<String, ModelInfo>,
    model_cache: HashMap<String, Vec<u8>>,
}

impl ModelRegistry {
    pub fn new() -> Self {
        Self {
            models: HashMap::new(),
            model_cache: HashMap::new(),
        }
    }

    pub async fn load_registry(&mut self) -> Result<(), JsValue> {
        let window = web_sys::window().unwrap();
        
        let mut opts = RequestInit::new();
        opts.method("GET");
        opts.mode(RequestMode::Cors);

        let request = Request::new_with_str_and_init("./models/model-registry.json", &opts)?;
        let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
        let resp: Response = resp_value.dyn_into().unwrap();

        let json = JsFuture::from(resp.json()?).await?;
        let registry_data: ModelRegistryData = json.into_serde()
            .map_err(|e| JsValue::from_str(&format!("Failed to parse registry: {}", e)))?;

        for model in registry_data.models {
            self.models.insert(model.name.clone(), model);
        }

        Ok(())
    }

    pub fn get_styles(&self) -> Vec<&ModelInfo> {
        self.models.values().collect()
    }

    pub fn get_model_info(&self, style_name: &str) -> Option<&ModelInfo> {
        self.models.get(style_name)
    }

    pub async fn get_model_data(&mut self, style_name: &str) -> Result<&[u8], JsValue> {
        if let Some(cached_data) = self.model_cache.get(style_name) {
            return Ok(cached_data);
        }

        let model_info = self.get_model_info(style_name)
            .ok_or_else(|| JsValue::from_str(&format!("Model '{}' not found", style_name)))?;

        let window = web_sys::window().unwrap();
        
        let mut opts = RequestInit::new();
        opts.method("GET");
        opts.mode(RequestMode::Cors);

        let url = format!("./models/{}", model_info.file_name);
        let request = Request::new_with_str_and_init(&url, &opts)?;
        
        let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
        let resp: Response = resp_value.dyn_into().unwrap();

        let array_buffer = JsFuture::from(resp.array_buffer()?).await?;
        let uint8_array = js_sys::Uint8Array::new(&array_buffer);
        let model_data = uint8_array.to_vec();

        self.model_cache.insert(style_name.to_string(), model_data);
        Ok(self.model_cache.get(style_name).unwrap())
    }
}
