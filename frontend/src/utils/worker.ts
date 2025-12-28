// Type declarations for rust-wasm module
interface RustWasmModule {
    default(): Promise<void>;
    initThreadPool(numThreads: number): Promise<void>;
    init_hooks(): Promise<void>;
    process_file(data: Uint8Array): unknown;
}

// Dynamic import for the rust wasm module
async function loadRustWasm(): Promise<RustWasmModule> {
    const module = (await import(
        '../rust-wasm/pkg/rust_wasm.js' as any
    )) as RustWasmModule;
    return module;
}

async function start(): Promise<void> {
    const rustWasm = await loadRustWasm();
    await rustWasm.default();
    await rustWasm.initThreadPool(navigator.hardwareConcurrency);
    await rustWasm.init_hooks();
}

// Define the message event type
interface WorkerMessageEvent extends MessageEvent {
    data: Blob | File;
}

// Worker context - using self as DedicatedWorkerGlobalScope
const workerSelf = self as unknown as {
    onmessage: ((e: WorkerMessageEvent) => void) | null;
    postMessage(message: unknown): void;
};

workerSelf.onmessage = async function (e: WorkerMessageEvent): Promise<void> {
    const rustWasm = await loadRustWasm();
    // receive the file from the main thread
    const file = e.data;
    console.log(file);
    const buffer = await e.data.arrayBuffer();
    console.log(buffer);
    const arr = new Uint8Array(buffer);

    const out = rustWasm.process_file(arr);
    workerSelf.postMessage(out);
};

start()
    .then(() => console.log('started'))
    .catch((error: unknown) => console.log(error));
