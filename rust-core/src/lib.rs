use wasm_bindgen::prelude::*;

mod engine;
mod models;

pub use engine::{ONNXStyleTransferEngine, ModelMetadata, StyleTransferResult};
pub use models::{ModelRegistry, load_onnx_model_from_url, validate_onnx_model, get_model_info};

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(start)]
pub fn main() {
    init_panic_hook();
}
