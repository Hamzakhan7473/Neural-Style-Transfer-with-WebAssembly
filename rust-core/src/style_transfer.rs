use wasm_bindgen::prelude::*;
use ort::{Environment, ExecutionProvider, Session, SessionBuilder, Value};
use ndarray::{Array4, Axis};
use crate::model_registry::{ModelRegistry, ModelInfo};
use crate::image_utils::ImageProcessor;
use crate::webgpu_backend::WebGPUBackend;

pub struct StyleTransferEngine {
    session: Option<Session>,
    current_model: Option<ModelInfo>,
    webgpu_backend: WebGPUBackend,
    image_processor: ImageProcessor,
}

impl StyleTransferEngine {
    pub fn new() -> Self {
        Self {
            session: None,
            current_model: None,
            webgpu_backend: WebGPUBackend::new(),
            image_processor: ImageProcessor::new(),
        }
    }

    pub async fn load_model(&mut self, registry: &ModelRegistry, style_name: &str) -> Result<(), JsValue> {
        let model_info = registry.get_model_info(style_name)
            .ok_or_else(|| JsValue::from_str(&format!("Style '{}' not found", style_name)))?;

        // Initialize WebGPU backend
        if let Err(e) = self.webgpu_backend.initialize().await {
            console_log!("WebGPU initialization failed: {:?}, falling back to CPU", e);
        }

        // Download model if not cached
        let model_data = registry.get_model_data(style_name).await?;

        // Create ONNX Runtime session with WebGPU backend if available
        let environment = Environment::builder()
            .with_name("StyleTransfer")
            .build()
            .map_err(|e| JsValue::from_str(&format!("Failed to create ONNX environment: {}", e)))?;

        let mut session_builder = SessionBuilder::new(&environment)
            .map_err(|e| JsValue::from_str(&format!("Failed to create session builder: {}", e)))?;

        // Try to use WebGPU if available, otherwise fall back to CPU
        if self.webgpu_backend.is_initialized() {
            session_builder = session_builder
                .with_execution_providers([ExecutionProvider::webgpu()])
                .map_err(|e| JsValue::from_str(&format!("Failed to set WebGPU provider: {}", e)))?;
            console_log!("Using WebGPU backend for inference");
        } else {
            console_log!("Using CPU backend for inference");
        }

        let session = session_builder
            .with_model_from_memory(model_data)
            .map_err(|e| JsValue::from_str(&format!("Failed to load model: {}", e)))?;

        self.session = Some(session);
        self.current_model = Some(model_info.clone());

        Ok(())
    }

    pub async fn stylize_image(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        style_strength: f32,
    ) -> Result<Vec<u8>, JsValue> {
        let session = self.session.as_ref()
            .ok_or_else(|| JsValue::from_str("No model loaded"))?;

        let model_info = self.current_model.as_ref()
            .ok_or_else(|| JsValue::from_str("No model info available"))?;

        // Preprocess image to model input format
        let preprocessed = self.image_processor.preprocess_image(
            image_data, 
            width, 
            height, 
            model_info.input_size
        )?;

        // Create input tensor
        let input_tensor = Array4::from_shape_vec(
            (1, 3, model_info.input_size, model_info.input_size),
            preprocessed,
        ).map_err(|e| JsValue::from_str(&format!("Failed to create input tensor: {}", e)))?;

        // Run inference
        let inputs = vec![(model_info.input_name.as_str(), Value::from_array(session.allocator(), &input_tensor)?)];
        
        let outputs = session.run(inputs)
            .map_err(|e| JsValue::from_str(&format!("Inference failed: {}", e)))?;

        // Get output tensor
        let output = outputs.get(&model_info.output_name)
            .ok_or_else(|| JsValue::from_str("Output tensor not found"))?;

        let output_array = output.try_extract::<f32>()
            .map_err(|e| JsValue::from_str(&format!("Failed to extract output: {}", e)))?
            .view()
            .to_owned();

        // Post-process the output
        let stylized_data = self.image_processor.postprocess_image(
            &output_array,
            width,
            height,
        )?;

        // Blend original and stylized based on style_strength
        let result = self.image_processor.blend_images(
            image_data,
            &stylized_data,
            width,
            height,
            style_strength,
        )?;

        Ok(result)
    }

    pub fn is_webgpu_supported(&self) -> bool {
        self.webgpu_backend.is_initialized()
    }
}
