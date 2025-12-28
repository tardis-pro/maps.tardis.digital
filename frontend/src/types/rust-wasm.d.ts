declare module '../rust-wasm/pkg/rust_wasm.js' {
    export function default_(): Promise<void>;
    export default function init(): Promise<void>;
    export function initThreadPool(numThreads: number): Promise<void>;
    export function init_hooks(): Promise<void>;
    export function process_file(data: Uint8Array): unknown;
}
