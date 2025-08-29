/* tslint:disable */
/* eslint-disable */
export function load_onnx_model_from_url(_style_name: string, _model_url: string): Uint8Array;
export function validate_onnx_model(model_data: Uint8Array): boolean;
export function get_model_info(model_data: Uint8Array): any;
export function main(): void;
export class ModelRegistry {
  free(): void;
  constructor();
  initialize(): Promise<void>;
  get_available_styles(): any;
  get_model_metadata(style_name: string): any;
  load_model(style_name: string): Promise<void>;
  apply_style_transfer(input_image_data: Uint8Array, _width: number, _height: number, style_strength: number, style_name: string): Promise<any>;
  get_total_model_size(): number;
  get_model_count(): number;
  is_model_loaded(style_name: string): boolean;
}
export class StyleTransferEngine {
  free(): void;
  constructor();
  initialize(): Promise<void>;
  is_ready(): boolean;
  load_style(style_name: string): Promise<void>;
  get_loaded_styles(): string[];
  transfer_style(image_data: Uint8Array, style_name: string, style_strength: number, progress_callback: Function): Promise<Uint8Array>;
  quick_transfer_style(image_data: Uint8Array, style_name: string, style_strength: number): Uint8Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_styletransferengine_free: (a: number, b: number) => void;
  readonly styletransferengine_new: () => number;
  readonly styletransferengine_initialize: (a: number) => any;
  readonly styletransferengine_is_ready: (a: number) => number;
  readonly styletransferengine_load_style: (a: number, b: number, c: number) => any;
  readonly styletransferengine_get_loaded_styles: (a: number) => [number, number];
  readonly styletransferengine_transfer_style: (a: number, b: number, c: number, d: number, e: number, f: number, g: any) => any;
  readonly styletransferengine_quick_transfer_style: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
  readonly __wbg_modelregistry_free: (a: number, b: number) => void;
  readonly modelregistry_new: () => number;
  readonly modelregistry_initialize: (a: number) => any;
  readonly modelregistry_get_available_styles: (a: number) => [number, number, number];
  readonly modelregistry_get_model_metadata: (a: number, b: number, c: number) => [number, number, number];
  readonly modelregistry_load_model: (a: number, b: number, c: number) => any;
  readonly modelregistry_apply_style_transfer: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => any;
  readonly modelregistry_get_total_model_size: (a: number) => number;
  readonly modelregistry_get_model_count: (a: number) => number;
  readonly modelregistry_is_model_loaded: (a: number, b: number, c: number) => number;
  readonly load_onnx_model_from_url: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly validate_onnx_model: (a: number, b: number) => [number, number, number];
  readonly get_model_info: (a: number, b: number) => [number, number, number];
  readonly main: () => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly closure25_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure18_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
