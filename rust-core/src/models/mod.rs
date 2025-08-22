use wasm_bindgen::prelude::*;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct StyleModel {
    pub name: String,
    pub description: String,
    pub size: f64,
    pub input_tensor_name: String,
    pub output_tensor_name: String,
    pub recommended_resolution: Resolution,
    pub preview_image: String,
    pub model_data: Option<Vec<u8>>,
    pub tensor_info: HashMap<String, TensorInfo>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TensorInfo {
    pub name: String,
    pub shape: Vec<u64>,
    pub data_type: String,
}

impl StyleModel {
    pub async fn load(style_name: &str) -> Result<Self, JsValue> {
        // In a real implementation, this would load the actual ONNX model
        // For now, we'll create a mock model structure
        let model = match style_name {
            "van-gogh" => Self::create_van_gogh_model(),
            "picasso" => Self::create_picasso_model(),
            "cyberpunk" => Self::create_cyberpunk_model(),
            "watercolor" => Self::create_watercolor_model(),
            "oil-painting" => Self::create_oil_painting_model(),
            _ => return Err(format!("Unknown style: {}", style_name).into()),
        };

        Ok(model)
    }

    pub fn get_input_shape(&self) -> Vec<u64> {
        self.tensor_info.get(&self.input_tensor_name)
            .map(|t| t.shape.clone())
            .unwrap_or(vec![1, 3, 512, 512])
    }

    pub fn get_output_shape(&self) -> Vec<u64> {
        self.tensor_info.get(&self.output_tensor_name)
            .map(|t| t.shape.clone())
            .unwrap_or(vec![1, 3, 512, 512])
    }

    fn create_van_gogh_model() -> Self {
        let mut tensor_info = HashMap::new();
        tensor_info.insert("input_image".to_string(), TensorInfo {
            name: "input_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });
        tensor_info.insert("output_image".to_string(), TensorInfo {
            name: "output_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });

        Self {
            name: "van-gogh".to_string(),
            description: "Van Gogh Starry Night".to_string(),
            size: 2.4,
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "output_image".to_string(),
            recommended_resolution: Resolution { width: 512, height: 512 },
            preview_image: "/styles/van-gogh-preview.jpg".to_string(),
            model_data: None,
            tensor_info,
        }
    }

    fn create_picasso_model() -> Self {
        let mut tensor_info = HashMap::new();
        tensor_info.insert("input_image".to_string(), TensorInfo {
            name: "input_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });
        tensor_info.insert("output_image".to_string(), TensorInfo {
            name: "output_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });

        Self {
            name: "picasso".to_string(),
            description: "Picasso Cubist Style".to_string(),
            size: 1.8,
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "output_image".to_string(),
            recommended_resolution: Resolution { width: 512, height: 512 },
            preview_image: "/styles/picasso-preview.jpg".to_string(),
            model_data: None,
            tensor_info,
        }
    }

    fn create_cyberpunk_model() -> Self {
        let mut tensor_info = HashMap::new();
        tensor_info.insert("input_image".to_string(), TensorInfo {
            name: "input_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });
        tensor_info.insert("output_image".to_string(), TensorInfo {
            name: "output_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });

        Self {
            name: "cyberpunk".to_string(),
            description: "Cyberpunk Neon Aesthetic".to_string(),
            size: 3.2,
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "output_image".to_string(),
            recommended_resolution: Resolution { width: 512, height: 512 },
            preview_image: "/styles/cyberpunk-preview.jpg".to_string(),
            model_data: None,
            tensor_info,
        }
    }

    fn create_watercolor_model() -> Self {
        let mut tensor_info = HashMap::new();
        tensor_info.insert("input_image".to_string(), TensorInfo {
            name: "input_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });
        tensor_info.insert("output_image".to_string(), TensorInfo {
            name: "output_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });

        Self {
            name: "watercolor".to_string(),
            description: "Watercolor Painting".to_string(),
            size: 2.1,
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "output_image".to_string(),
            recommended_resolution: Resolution { width: 512, height: 512 },
            preview_image: "/styles/watercolor-preview.jpg".to_string(),
            model_data: None,
            tensor_info,
        }
    }

    fn create_oil_painting_model() -> Self {
        let mut tensor_info = HashMap::new();
        tensor_info.insert("input_image".to_string(), TensorInfo {
            name: "input_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });
        tensor_info.insert("output_image".to_string(), TensorInfo {
            name: "output_image".to_string(),
            shape: vec![1, 3, 512, 512],
            data_type: "float32".to_string(),
        });

        Self {
            name: "oil-painting".to_string(),
            description: "Classic Oil Painting".to_string(),
            size: 2.7,
            input_tensor_name: "input_image".to_string(),
            output_tensor_name: "output_image".to_string(),
            recommended_resolution: Resolution { width: 512, height: 512 },
            preview_image: "/styles/oil-painting-preview.jpg".to_string(),
            model_data: None,
            tensor_info,
        }
    }
}

// ModelRegistry removed for now due to WASM binding complexity
// Will be re-implemented when needed
