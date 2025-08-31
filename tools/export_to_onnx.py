#!/usr/bin/env python3
"""
TensorFlow to ONNX converter for style transfer models.
Usage: python export_to_onnx.py --model_path /path/to/saved_model --output_path model.onnx
"""

import argparse
import tensorflow as tf
import tf2onnx
import os

def convert_to_onnx(model_path, output_path, input_shape=(256, 256, 3)):
    """Convert TensorFlow SavedModel to ONNX format."""
    
    print(f"Loading model from: {model_path}")
    
    # Load the SavedModel
    if os.path.isdir(model_path):
        model = tf.saved_model.load(model_path)
        # If it's a SavedModel, we need to get the concrete function
        if hasattr(model, 'signatures'):
            concrete_func = model.signatures['serving_default']
        else:
            concrete_func = model
    else:
        # Try loading as Keras model
        model = tf.keras.models.load_model(model_path)
        concrete_func = model
    
    print(f"Model loaded successfully")
    print(f"Input shape: {input_shape}")
    
    # Convert to ONNX
    print("Converting to ONNX...")
    onnx_model, _ = tf2onnx.convert.from_function(
        concrete_func,
        input_signature=[tf.TensorSpec(input_shape, tf.float32, name="input")],
        opset=13,
        output_path=output_path
    )
    
    print(f"ONNX model saved to: {output_path}")
    print(f"Model size: {os.path.getsize(output_path) / (1024*1024):.2f} MB")
    
    return onnx_model

def main():
    parser = argparse.ArgumentParser(description='Convert TensorFlow model to ONNX')
    parser.add_argument('--model_path', required=True, help='Path to TensorFlow SavedModel or Keras model')
    parser.add_argument('--output_path', required=True, help='Output ONNX file path')
    parser.add_argument('--input_width', type=int, default=256, help='Input width')
    parser.add_argument('--input_height', type=int, default=256, help='Input height')
    parser.add_argument('--input_channels', type=int, default=3, help='Input channels')
    
    args = parser.parse_args()
    
    input_shape = (args.input_height, args.input_width, args.input_channels)
    
    try:
        convert_to_onnx(args.model_path, args.output_path, input_shape)
        print("Conversion completed successfully!")
    except Exception as e:
        print(f"Conversion failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
