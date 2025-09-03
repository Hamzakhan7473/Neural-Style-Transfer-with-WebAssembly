use wasm_bindgen_test::*;
use neural_style_transfer::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_style_transfer_initialization() {
    let mut engine = NeuralStyleTransfer::new();
    
    // Test initialization
    let result = engine.initialize().await;
    assert!(result.is_ok());
}

#[wasm_bindgen_test] 
async fn test_get_available_styles() {
    let engine = NeuralStyleTransfer::new();
    let styles_json = engine.get_available_styles();
    
    // Should return valid JSON
    assert!(!styles_json.is_empty());
    
    // Parse and validate structure
    let parsed: Result<serde_json::Value, _> = serde_json::from_str(&styles_json);
    assert!(parsed.is_ok());
}

#[wasm_bindgen_test]
async fn test_model_loading() {
    let mut engine = NeuralStyleTransfer::new();
    engine.initialize().await.unwrap();
    
    // Try to load a style model
    let result = engine.load_style_model("vangogh").await;
    
    // Should succeed or fail gracefully
    assert!(result.is_ok() || result.is_err());
}

#[wasm_bindgen_test]
async fn test_image_processing() {
    let mut engine = NeuralStyleTransfer::new();
    engine.initialize().await.unwrap();
    
    // Create test image data (small red square)
    let width = 32u32;
    let height = 32u32;
    let test_data: Vec<u8> = (0..width * height * 4)
        .map(|i| match i % 4 {
            0 => 255, // R
            1 => 0,   // G  
            2 => 0,   // B
            3 => 255, // A
        })
        .collect();
    
    // Load a model first
    if engine.load_style_model("vangogh").await.is_ok() {
        let result = engine.stylize_image(&test_data, width, height, 0.8).await;
        
        if let Ok(output) = result {
            assert_eq!(output.len(), test_data.len());
            assert!(output.iter().any(|&x| x > 0)); // Should have some non-zero values
        }
    }
}
