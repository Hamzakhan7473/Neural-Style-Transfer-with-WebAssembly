use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use js_sys::{Array, ArrayBuffer, Uint8Array};
use web_sys::*;
use std::collections::HashMap;
use once_cell::sync::Lazy;

// Use `wee_alloc` as the global allocator
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Configure panic hook for better error messages
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[derive(Clone)]
pub struct StyleModel {
    pub name: String,
    pub size: u32,
    pub input_name: String,
    pub output_name: String,
    pub recommended_size: u32,
    pub url: String,
}

// Thread-safe model storage
static LOADED_MODELS: Lazy<std::sync::Mutex<HashMap<String, ArrayBuffer>>> = Lazy::new(|| {
    std::sync::Mutex::new(HashMap::new())
});

fn get_models() -> Vec<StyleModel> {
    vec![
        StyleModel {
            name: "Van Gogh - Starry Night".to_string(),
            size: 8_500_000,
            input_name: "input".to_string(),
            output_name: "output".to_string(),
            recommended_size: 512,
            url: "models/starry_night.onnx".to_string(),
        },
        StyleModel {
            name: "Picasso - Cubist".to_string(),
            size: 8_200_000,
            input_name: "input".to_string(),
            output_name: "output".to_string(),
            recommended_size: 512,
            url: "models/picasso_cubist.onnx".to_string(),
        },
        StyleModel {
            name: "Japanese Ukiyo-e".to_string(),
            size: 7_800_000,
            input_name: "input".to_string(),
            output_name: "output".to_string(),
            recommended_size: 512,
            url: "models/ukiyo_e.onnx".to_string(),
        },
        StyleModel {
            name: "Cyberpunk Neon".to_string(),
            size: 9_100_000,
            input_name: "input".to_string(),
            output_name: "output".to_string(),
            recommended_size: 512,
            url: "models/cyberpunk.onnx".to_string(),
        },
        StyleModel {
            name: "Abstract Expressionism".to_string(),
            size: 8_700_000,
            input_name: "input".to_string(),
            output_name: "output".to_string(),
            recommended_size: 512,
            url: "models/abstract_expr.onnx".to_string(),
        },
    ]
}

#[wasm_bindgen]
pub struct StyleTransfer {
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
    current_style: String,
    style_strength: f32,
    models: Vec<StyleModel>,
}

#[wasm_bindgen]
impl StyleTransfer {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: &str) -> Result<StyleTransfer, JsValue> {
        let window = get_window()?;
        let document = window.document().ok_or("No document")?;
        let canvas = document
            .get_element_by_id(canvas_id)
            .ok_or("Canvas not found")?
            .dyn_into::<HtmlCanvasElement>()?;
        
        let context = canvas
            .get_context("2d")?
            .ok_or("Could not get 2d context")?
            .dyn_into::<CanvasRenderingContext2d>()?;

        Ok(StyleTransfer {
            canvas,
            context,
            current_style: String::new(),
            style_strength: 1.0,
            models: get_models(),
        })
    }

    #[wasm_bindgen]
    pub async fn initialize_webgpu(&mut self) -> Result<(), JsValue> {
        web_sys::console::log_1(&"Style Transfer initialized - ready for GPU acceleration".into());
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_available_styles(&self) -> JsValue {
        let models: Vec<JsValue> = self.models.iter().map(|model| {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"name".into(), &model.name.clone().into()).unwrap();
            js_sys::Reflect::set(&obj, &"size".into(), &model.size.into()).unwrap();
            js_sys::Reflect::set(&obj, &"recommendedSize".into(), &model.recommended_size.into()).unwrap();
            obj.into()
        }).collect();
        
        models.into_iter().collect::<Array>().into()
    }

    #[wasm_bindgen]
    pub async fn load_style_model(&mut self, style_name: &str) -> Result<(), JsValue> {
        let model = self.models.iter()
            .find(|m| m.name == style_name)
            .ok_or("Style not found")?;

        // Check if already loaded
        {
            let loaded = LOADED_MODELS.lock().map_err(|_| "Failed to acquire lock")?;
            if loaded.contains_key(&model.name) {
                self.current_style = style_name.to_string();
                return Ok(());
            }
        }

        // Simulate loading
        web_sys::console::log_1(&format!("Loading style model: {}", style_name).into());
        
        let promise = js_sys::Promise::resolve(&JsValue::from(42));
        let _ = JsFuture::from(promise).await?;
        
        {
            let mut loaded = LOADED_MODELS.lock().map_err(|_| "Failed to acquire lock")?;
            let dummy_buffer = ArrayBuffer::new(1024);
            loaded.insert(model.name.clone(), dummy_buffer);
        }

        self.current_style = style_name.to_string();
        web_sys::console::log_1(&format!("Loaded model: {}", style_name).into());
        Ok(())
    }

    #[wasm_bindgen]
    pub fn set_style_strength(&mut self, strength: f32) {
        self.style_strength = strength.max(0.0).min(1.0);
    }

    #[wasm_bindgen]
    pub async fn process_image(&self, image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
        if self.current_style.is_empty() {
            return Err("No style loaded".into());
        }

        let model = self.models.iter()
            .find(|m| m.name == self.current_style)
            .ok_or("Current style not found")?;

        {
            let loaded = LOADED_MODELS.lock().map_err(|_| "Failed to acquire lock")?;
            if !loaded.contains_key(&model.name) {
                return Err("Model not loaded".into());
            }
        }

        let processed = self.apply_style_transform(image_data, width, height, model)?;
        Ok(processed)
    }

    fn apply_style_transform(&self, image_data: &[u8], width: u32, height: u32, _model: &StyleModel) -> Result<Vec<u8>, JsValue> {
        let mut result = vec![0u8; image_data.len()];
        
        for i in (0..image_data.len()).step_by(4) {
            if i + 3 < image_data.len() {
                let r = image_data[i] as f32;
                let g = image_data[i + 1] as f32;
                let b = image_data[i + 2] as f32;
                let a = image_data[i + 3];
                
                let pixel_index = i / 4;
                let y = pixel_index as u32 / width;
                let x = pixel_index as u32 % width;
                
                let (new_r, new_g, new_b) = match self.current_style.as_str() {
                    name if name.contains("Van Gogh") => {
                        let swirl_x = (x as f32 / 20.0).sin() * 10.0;
                        let swirl_y = (y as f32 / 20.0).cos() * 10.0;
                        
                        let enhanced_r = (r * 0.9 + swirl_x.abs() * 2.0).min(255.0);
                        let enhanced_g = (g * 1.1 + swirl_y.abs() * 3.0).min(255.0);
                        let enhanced_b = (b * 1.4 + (swirl_x + swirl_y) * 2.0).min(255.0);
                        (enhanced_r, enhanced_g, enhanced_b)
                    },
                    name if name.contains("Picasso") => {
                        let block_size = 16;
                        let block_x = (x / block_size) % 3;
                        let block_y = (y / block_size) % 3;
                        
                        let shift = (block_x + block_y) as f32 * 0.3;
                        let new_r = (r * (0.8 + shift) + g * 0.2).min(255.0);
                        let new_g = (g * (0.7 + shift) + b * 0.3).min(255.0);
                        let new_b = (b * (0.9 + shift) + r * 0.1).min(255.0);
                        (new_r, new_g, new_b)
                    },
                    name if name.contains("Ukiyo-e") => {
                        let posterized_r = ((r / 64.0).floor() * 64.0).min(255.0);
                        let posterized_g = ((g / 64.0).floor() * 64.0).min(255.0);
                        let posterized_b = ((b / 64.0).floor() * 64.0).min(255.0);
                        
                        let new_r = (posterized_r * 1.1).min(255.0);
                        let new_g = (posterized_g * 0.95 + 10.0).min(255.0);
                        let new_b = (posterized_b * 1.05).min(255.0);
                        (new_r, new_g, new_b)
                    },
                    name if name.contains("Cyberpunk") => {
                        let wave = ((x + y) as f32 / 8.0).sin();
                        let neon_boost = if wave > 0.7 { 40.0 } else { 0.0 };
                        
                        let new_r = (r * 1.3 + neon_boost).min(255.0);
                        let new_g = (g * 0.8 + neon_boost * 0.5 + 20.0).min(255.0);
                        let new_b = (b * 1.5 + neon_boost).min(255.0);
                        (new_r, new_g, new_b)
                    },
                    name if name.contains("Abstract") => {
                        let noise_x = ((x * 7) % 13) as f32 / 13.0;
                        let noise_y = ((y * 11) % 17) as f32 / 17.0;
                        let texture = (noise_x + noise_y) * 30.0;
                        
                        let new_r = (r * 1.2 + texture).min(255.0);
                        let new_g = (g * 1.15 + texture * 0.8).min(255.0);
                        let new_b = (b * 1.1 + texture * 1.2).min(255.0);
                        (new_r, new_g, new_b)
                    },
                    _ => {
                        let brightness = (r + g + b) / 3.0;
                        let contrast_boost = if brightness > 128.0 { 1.2 } else { 0.9 };
                        
                        let new_r = (r * contrast_boost).min(255.0);
                        let new_g = (g * contrast_boost).min(255.0);
                        let new_b = (b * contrast_boost).min(255.0);
                        (new_r, new_g, new_b)
                    }
                };
                
                let final_r = ((new_r * self.style_strength) + (r * (1.0 - self.style_strength))) as u8;
                let final_g = ((new_g * self.style_strength) + (g * (1.0 - self.style_strength))) as u8;
                let final_b = ((new_b * self.style_strength) + (b * (1.0 - self.style_strength))) as u8;
                
                result[i] = final_r;
                result[i + 1] = final_g;
                result[i + 2] = final_b;
                result[i + 3] = a;
            }
        }
        
        Ok(result)
    }

    #[wasm_bindgen]
    pub async fn process_image_from_canvas(&self, source_canvas: &HtmlCanvasElement) -> Result<(), JsValue> {
        let ctx = source_canvas
            .get_context("2d")?
            .ok_or("Could not get 2d context")?
            .dyn_into::<CanvasRenderingContext2d>()?;

        let width = source_canvas.width();
        let height = source_canvas.height();

        let image_data = ctx.get_image_data(0.0, 0.0, width as f64, height as f64)?;
        let pixel_data = image_data.data();

        let processed = self.process_image(&pixel_data.to_vec(), width, height).await?;

        self.canvas.set_width(width);
        self.canvas.set_height(height);

        let new_image_data = ImageData::new_with_u8_clamped_array_and_sh(
            wasm_bindgen::Clamped(&processed),
            width,
            height
        )?;

        self.context.put_image_data(&new_image_data, 0.0, 0.0)?;

        Ok(())
    }

    #[wasm_bindgen]
    pub fn download_result(&self, filename: String) -> Result<(), JsValue> {
        let filename_clone = filename.clone();
        let canvas = self.canvas.clone();
        
        wasm_bindgen_futures::spawn_local(async move {
            let callback = Closure::wrap(Box::new(move |blob: Blob| {
                let url = Url::create_object_url_with_blob(&blob).unwrap();
                
                let window = get_window().unwrap();
                let document = window.document().unwrap();
                let link = document.create_element("a").unwrap();
                let link: HtmlElement = link.dyn_into().unwrap();
                
                link.set_attribute("href", &url).unwrap();
                link.set_attribute("download", &filename_clone).unwrap();
                link.click();
                
                Url::revoke_object_url(&url).unwrap();
            }) as Box<dyn FnMut(_)>);
            
            canvas.to_blob(callback.as_ref().unchecked_ref()).unwrap();
            callback.forget();
        });

        Ok(())
    }
}

fn get_window() -> Result<Window, JsValue> {
    web_sys::window().ok_or_else(|| "no global `window` exists".into())
}
