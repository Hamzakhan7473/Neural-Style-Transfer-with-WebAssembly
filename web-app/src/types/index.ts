export interface StyleModel {
  name: string;
  description: string;
  size: number;
  inputTensorName: string;
  outputTensorName: string;
  recommendedResolution: {
    width: number;
    height: number;
  };
  previewImage: string;
}

export interface StyleTransferResult {
  originalImage: string;
  stylizedImage: string;
  styleName: string;
  processingTime: number;
  timestamp: Date;
}

export interface WebcamFrame {
  data: ImageData;
  timestamp: number;
}

export interface ProcessingOptions {
  styleStrength: number;
  resolution: {
    width: number;
    height: number;
  };
  quality: 'low' | 'medium' | 'high';
}

export interface ModelRegistry {
  [key: string]: StyleModel;
}

