#![feature(test)]
extern crate test;

use test::Bencher;
use neural_style_transfer::*;

#[bench]
fn bench_image_preprocessing(b: &mut Bencher) {
    let width = 512u32;
    let height = 512u32; 
    let test_data: Vec<u8> = (0..width * height * 4).map(|_| 128).collect();
    
    b.iter(|| {
        // Benchmark preprocessing logic
        let _processed = preprocess_test_image(&test_data, width, height);
    });
}

fn preprocess_test_image(data: &[u8], width: u32, height: u32) -> Vec<f32> {
    // Simplified preprocessing for benchmarking
    data.chunks(4)
        .take((width * height) as usize)
        .flat_map(|pixel| {
            let r = pixel[0] as f32 / 255.0 * 2.0 - 1.0;
            let g = pixel[1] as f32 / 255.0 * 2.0 - 1.0;
            let b = pixel[2] as f32 / 255.0 * 2.0 - 1.0;
            [r, g, b]
        })
        .collect()
}

#[bench]
fn bench_tensor_operations(b: &mut Bencher) {
    let size = 512 * 512 * 3;
    let data: Vec<f32> = (0..size).map(|i| (i as f32) * 0.001).collect();
    
    b.iter(|| {
        // Benchmark tensor manipulations
        let _result: Vec<f32> = data
            .iter()
            .map(|&x| x.tanh()) // Apply activation function
            .map(|x| (x + 1.0) * 127.5) // Denormalize
            .collect();
    });
}
