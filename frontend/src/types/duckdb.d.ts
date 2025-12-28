declare module '@duckdb/duckdb-wasm' {
    export class AsyncDuckDB {
        constructor(logger: Logger, worker: Worker);
        instantiate(
            module: string,
            pthreadWorker?: string,
            progress?: (p: InstantiationProgress) => void
        ): Promise<void>;
        open(config?: DuckDBConfig): Promise<void>;
        connect(): Promise<AsyncDuckDBConnection>;
    }
    export class AsyncDuckDBConnection {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface Logger {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface DuckDBConfig {}
    export interface DuckDBBundle {
        mainModule: string;
        mainWorker?: string;
        pthreadWorker?: string;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface DuckDBBundles {}
    export interface InstantiationProgress {
        step: number;
        totalSteps: number;
    }
    export function selectBundle(bundles: DuckDBBundles): Promise<DuckDBBundle>;
}

declare module 'immutable' {
    export function Map<K, V>(): Map<K, V>;
    export function List<T>(): List<T>;
    export interface Map<K, V> {
        get(key: K): V | undefined;
        set(key: K, value: V): Map<K, V>;
    }
    export interface List<T> {
        push(value: T): List<T>;
        [Symbol.iterator](): Iterator<T>;
    }
}
