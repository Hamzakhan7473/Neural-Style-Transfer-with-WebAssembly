use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{GpuAdapter, GpuDevice, Navigator, Gpu};

pub struct WebGPUBackend {
    device: Option<GpuDevice>,
    adapter: Option<GpuAdapter>,
}

impl WebGPUBackend {
    pub fn new() -> Self {
        Self {
            device: None,
            adapter: None,
        }
    }

    pub async fn initialize(&mut self) -> Result<(), JsValue> {
        let window = web_sys::window().ok_or("No global `window` exists")?;
        let navigator = window.navigator();
        
        // Check if WebGPU is supported
        let gpu: Gpu = js_sys::Reflect::get(&navigator, &JsValue::from_str("gpu"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("WebGPU not supported"))?;

        // Request adapter
        let adapter_promise = gpu.request_adapter();
        let adapter_js_value = JsFuture::from(adapter_promise).await?;
        
        if adapter_js_value.is_null() {
            return Err(JsValue::from_str("Failed to get WebGPU adapter"));
        }

        let adapter: GpuAdapter = adapter_js_value.dyn_into()?;

        // Request device
        let device_promise = adapter.request_device();
        let device_js_value = JsFuture::from(device_promise).await?;
        let device: GpuDevice = device_js_value.dyn_into()?;

        self.adapter = Some(adapter);
        self.device = Some(device);

        Ok(())
    }

    pub fn is_initialized(&self) -> bool {
        self.device.is_some() && self.adapter.is_some()
    }

    pub fn get_device(&self) -> Option<&GpuDevice> {
        self.device.as_ref()
    }
}
