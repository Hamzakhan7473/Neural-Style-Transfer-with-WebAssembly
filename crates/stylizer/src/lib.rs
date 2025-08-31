use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use serde::{Deserialize, Serialize};
use js_sys::{Uint8Array, Promise};
use web_sys::{window, Request, RequestInit, RequestMode, Response};
use once_cell::unsync::OnceCell;
use thiserror::Error;

// WONNX
use wonnx::session::Session;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Error, Debug)]
pub enum StylizerError {
    #[error("web error: {0}")] Web(String),
    #[error("model not loaded")] ModelNotLoaded,
    #[error("invalid input dimensions")] InvalidDims,
}

impl From<StylizerError> for JsValue { fn from(e: StylizerError) -> Self { JsValue::from_str(&e.to_string()) } }

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelMeta {
    pub model_url: String,
    pub input_name: String,
    pub output_name: String,
    pub input_width: u32,
    pub input_height: u32,
    #[serde(default = "default_scale")] pub scale: f32,             // multiply after mean/std (e.g., 255.0 or 1.0)
    #[serde(default = "default_mean")] pub mean: [f32; 3],          // per‑channel mean
    #[serde(default = "default_std")]  pub std: [f32; 3],           // per‑channel std
}
fn default_scale() -> f32 { 1.0 }
fn default_mean() -> [f32; 3] { [0.0, 0.0, 0.0] }
fn default_std()  -> [f32; 3] { [1.0, 1.0, 1.0] }

struct State {
    meta: ModelMeta,
    session: Session,
}

thread_local! {
    static STATE: OnceCell<State> = OnceCell::new();
}

async fn fetch_bytes(url: &str) -> Result<Vec<u8>, StylizerError> {
    let win = window().ok_or_else(|| StylizerError::Web("no window".into()))?;
    let mut opts = RequestInit::new();
    opts.method("GET");
    opts.mode(RequestMode::Cors);

    let request = Request::new_with_str_and_init(url, &opts)
        .map_err(|e| StylizerError::Web(format!("request: {:?}", e)))?;

    let resp_value = JsFuture::from(win.fetch_with_request(&request))
        .await
        .map_err(|e| StylizerError::Web(format!("fetch: {:?}", e)))?;
    let resp: Response = resp_value.dyn_into().unwrap();
    let buf = JsFuture::from(resp.array_buffer().unwrap())
        .await
        .map_err(|e| StylizerError::Web(format!("array_buffer: {:?}", e)))?;

    let u8arr = Uint8Array::new(&buf);
    let mut bytes = vec![0u8; u8arr.length() as usize];
    u8arr.copy_to(&mut bytes[..]);
    Ok(bytes)
}

#[wasm_bindgen]
pub async fn load_model(meta_json: String) -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    let meta: ModelMeta = serde_json::from_str(&meta_json)
        .map_err(|e| StylizerError::Web(format!("bad meta: {e}")))?;

    log(&format!("Loading ONNX model: {}", meta.model_url));
    let bytes = fetch_bytes(&meta.model_url).await.map_err(JsValue::from)?;

    // WONNX session from bytes
    let session = Session::from_bytes(&bytes)
        .await
        .map_err(|e| StylizerError::Web(format!("wonnx session: {e}")))?;

    STATE.with(|s| {
        let st = State { meta: meta.clone(), session };
        let _ = s.set(st);
    });

    Ok(())
}

fn bilinear_resize_rgba(src: &[u8], sw: u32, sh: u32, dw: u32, dh: u32) -> Vec<u8> {
    if sw == dw && sh == dh { return src.to_vec(); }
    let mut dst = vec![0u8; (dw * dh * 4) as usize];
    let x_ratio = (sw - 1) as f32 / dw as f32;
    let y_ratio = (sh - 1) as f32 / dh as f32;
    for y in 0..dh {
        let fy = y as f32 * y_ratio;
        let y_l = fy.floor() as u32;
        let y_h = (y_l + 1).min(sh - 1);
        let y_w = fy - y_l as f32;
        for x in 0..dw {
            let fx = x as f32 * x_ratio;
            let x_l = fx.floor() as u32;
            let x_h = (x_l + 1).min(sw - 1);
            let x_w = fx - x_l as f32;
            let idx = ((y * dw + x) * 4) as usize;
            for c in 0..4 {
                let p00 = src[((y_l * sw + x_l) * 4 + c) as usize] as f32;
                let p10 = src[((y_l * sw + x_h) * 4 + c) as usize] as f32;
                let p01 = src[((y_h * sw + x_l) * 4 + c) as usize] as f32;
                let p11 = src[((y_h * sw + x_h) * 4 + c) as usize] as f32;
                let p0 = p00 * (1.0 - x_w) + p10 * x_w;
                let p1 = p01 * (1.0 - x_w) + p11 * x_w;
                let p = p0 * (1.0 - y_w) + p1 * y_w;
                dst[idx + c] = p.round().clamp(0.0, 255.0) as u8;
            }
        }
    }
    dst
}

fn nchw_from_rgba(
    rgba: &[u8], w: u32, h: u32, mean: [f32; 3], std: [f32; 3], scale: f32
) -> Vec<f32> {
    // output: [1,3,h,w]
    let mut out = vec![0f32; (3 * w * h) as usize];
    let plane = (w * h) as usize;
    for y in 0..h as usize {
        for x in 0..w as usize {
            let i = (y * w as usize + x) * 4;
            let r = rgba[i] as f32 / 255.0;
            let g = rgba[i + 1] as f32 / 255.0;
            let b = rgba[i + 2] as f32 / 255.0;
            let (r, g, b) = (
                ((r - mean[0]) / std[0]) * scale,
                ((g - mean[1]) / std[1]) * scale,
                ((b - mean[2]) / std[2]) * scale,
            );
            let idx = y * w as usize + x;
            out[idx] = r;               // R plane
            out[plane + idx] = g;       // G plane
            out[plane * 2 + idx] = b;   // B plane
        }
    }
    out
}

fn rgba_from_nchw(data: &[f32], w: u32, h: u32, mean: [f32;3], std: [f32;3], scale: f32) -> Vec<u8> {
    let plane = (w * h) as usize;
    let mut out = vec![0u8; (w * h * 4) as usize];
    for y in 0..h as usize {
        for x in 0..w as usize {
            let idx = y * w as usize + x;
            let mut r = data[idx];
            let mut g = data[plane + idx];
            let mut b = data[plane * 2 + idx];
            // invert normalization approximately
            r = (r / scale) * std[0] + mean[0];
            g = (g / scale) * std[1] + mean[1];
            b = (b / scale) * std[2] + mean[2];
            let i = (idx * 4) as usize;
            out[i]     = (r * 255.0).clamp(0.0, 255.0) as u8;
            out[i + 1] = (g * 255.0).clamp(0.0, 255.0) as u8;
            out[i + 2] = (b * 255.0).clamp(0.0, 255.0) as u8;
            out[i + 3] = 255u8;
        }
    }
    out
}

#[wasm_bindgen]
pub async fn run_style(
    input_rgba: Uint8Array,
    in_width: u32,
    in_height: u32,
) -> Result<Uint8Array, JsValue> {
    let rgba = input_rgba.to_vec();
    let (meta, session) = STATE.with(|s| {
        let st = s.get();
        st.map(|st| (st.meta.clone(), &st.session)).ok_or(StylizerError::ModelNotLoaded)
    }).map_err(JsValue::from)?;

    // Resize to model input
    let resized = bilinear_resize_rgba(&rgba, in_width, in_height, meta.input_width, meta.input_height);

    // NCHW float32
    let input_tensor = nchw_from_rgba(&resized, meta.input_width, meta.input_height, meta.mean, meta.std, meta.scale);

    // WONNX inference
    let mut outputs = session
        .run(vec![(meta.input_name.clone(), input_tensor)])
        .await
        .map_err(|e| StylizerError::Web(format!("wonnx run: {e}")))?;

    // Extract
    let out = outputs
        .remove(&meta.output_name)
        .ok_or_else(|| StylizerError::Web("missing output".into()))?;

    // WONNX returns owned f32 vec for the output
    let stylized = rgba_from_nchw(&out, meta.input_width, meta.input_height, meta.mean, meta.std, meta.scale);

    // Return (model resolution). Frontend can scale back to original size & blend.
    Ok(Uint8Array::from(stylized.as_slice()))
}

// Optional helper: blend in WASM if you prefer
#[wasm_bindgen]
pub fn blend_rgba(base_rgba: Uint8Array, top_rgba: Uint8Array, width: u32, height: u32, strength: f32) -> Result<Uint8Array, JsValue> {
    let mut base = base_rgba.to_vec();
    let top = top_rgba.to_vec();
    if base.len() != top.len() { return Err(StylizerError::InvalidDims.into()); }
    let a = strength.clamp(0.0, 1.0);
    for i in (0..base.len()).step_by(4) {
        base[i]     = ((1.0 - a) * base[i]     as f32 + a * top[i]     as f32).round() as u8;
        base[i + 1] = ((1.0 - a) * base[i + 1] as f32 + a * top[i + 1] as f32).round() as u8;
        base[i + 2] = ((1.0 - a) * base[i + 2] as f32 + a * top[i + 2] as f32).round() as u8;
        base[i + 3] = 255u8;
    }
    Ok(Uint8Array::from(base.as_slice()))
}
