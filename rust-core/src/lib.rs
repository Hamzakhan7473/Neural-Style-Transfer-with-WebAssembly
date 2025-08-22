use wasm_bindgen::prelude::*;

mod engine;
mod models;
mod gpu;
mod utils;

pub use engine::StyleTransferEngine;
pub use models::*;
pub use gpu::GpuContext;

// Called when the WASM module is instantiated
#[wasm_bindgen(start)]
pub fn main() {
    utils::set_panic_hook();
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}
