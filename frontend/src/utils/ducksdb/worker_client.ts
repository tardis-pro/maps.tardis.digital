/**
 * DuckDB Worker Client
 *
 * TypeScript wrapper for the DuckDB Web Worker.
 * Ensures all database operations run off the main UI thread.
 */

import type { DuckDBConfig } from '@duckdb/duckdb-wasm';
import duckdbWorker from './duckdb.worker?worker';

export interface QueryResult {
    data: Record<string, unknown>[];
    columns: { columnName: string; columnType: string }[];
}

export interface WorkerClientConfig {
    config?: DuckDBConfig;
    onProgress?: (progress: number) => void;
}

type WorkerResponse =
    | { type: 'ready'; version: string }
    | {
          type: 'result';
          data: Record<string, unknown>[];
          types: { columnName: string; columnType: string }[];
      }
    | { type: 'error'; message: string }
    | { type: 'pong' }
    | { type: 'progress'; value: number };

/**
 * DuckDB Worker Client
 *
 * A client for interacting with DuckDB running in a dedicated Web Worker.
 * All queries are executed off the main thread to prevent UI blocking.
 */
export class DuckDBWorkerClient {
    private worker: Worker;
    private ready: Promise<void>;
    private config?: DuckDBConfig;
    private onProgress?: (progress: number) => void;
    private resolveReady!: () => void;
    private rejectReady!: (error: Error) => void;

    constructor(config?: WorkerClientConfig) {
        this.config = config?.config;
        this.onProgress = config?.onProgress;

        this.ready = new Promise((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });

        this.worker = new duckdbWorker();

        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type } = event.data;

            switch (type) {
                case 'ready':
                    this.resolveReady();
                    break;
                case 'error':
                    this.rejectReady(new Error(event.data.message));
                    break;
                case 'progress':
                    this.onProgress?.(event.data.value);
                    break;
            }
        };

        this.worker.onerror = (error) => {
            this.rejectReady(
                error instanceof Error ? error : new Error('Worker error')
            );
        };

        // Initialize the worker
        this.worker.postMessage({ type: 'init', config: this.config });
    }

    /**
     * Wait for the worker to be ready
     */
    async readyState(): Promise<void> {
        return this.ready;
    }

    /**
     * Execute a SQL query
     */
    async query(sql: string, params?: unknown[]): Promise<QueryResult> {
        await this.readyState();

        return new Promise((resolve, reject) => {
            const handler = (event: MessageEvent<WorkerResponse>) => {
                if (event.data.type === 'result') {
                    this.worker.removeEventListener('message', handler);
                    resolve({
                        data: event.data.data,
                        columns: event.data.types,
                    });
                } else if (event.data.type === 'error') {
                    this.worker.removeEventListener('message', handler);
                    reject(new Error(event.data.message));
                }
            };

            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'query', query: sql, params });
        });
    }

    /**
     * Register a file in the database
     */
    async registerFile(name: string, data: Uint8Array): Promise<void> {
        await this.readyState();

        return new Promise((resolve, reject) => {
            const handler = (event: MessageEvent<WorkerResponse>) => {
                if (event.data.type === 'result') {
                    this.worker.removeEventListener('message', handler);
                    resolve();
                } else if (event.data.type === 'error') {
                    this.worker.removeEventListener('message', handler);
                    reject(new Error(event.data.message));
                }
            };

            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'registerFile', name, data });
        });
    }

    /**
     * Insert Arrow data
     */
    async insertArrow(name: string, arrow: Uint8Array): Promise<void> {
        await this.readyState();

        return new Promise((resolve, reject) => {
            const handler = (event: MessageEvent<WorkerResponse>) => {
                if (event.data.type === 'result') {
                    this.worker.removeEventListener('message', handler);
                    resolve();
                } else if (event.data.type === 'error') {
                    this.worker.removeEventListener('message', handler);
                    reject(new Error(event.data.message));
                }
            };

            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'insertArrow', name, arrow });
        });
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        await this.readyState();

        return new Promise((resolve) => {
            this.worker.postMessage({ type: 'close' });
            this.worker.terminate();
            resolve();
        });
    }

    /**
     * Ping the worker to check if it's alive
     */
    async ping(): Promise<boolean> {
        await this.readyState();

        return new Promise((resolve) => {
            const handler = (event: MessageEvent<WorkerResponse>) => {
                if (event.data.type === 'pong') {
                    this.worker.removeEventListener('message', handler);
                    resolve(true);
                }
            };

            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'ping' });

            // Timeout after 5 seconds
            setTimeout(() => {
                this.worker.removeEventListener('message', handler);
                resolve(false);
            }, 5000);
        });
    }
}

/**
 * Singleton instance of the DuckDB worker client
 */
let globalClient: DuckDBWorkerClient | null = null;

/**
 * Get or create the global DuckDB worker client
 */
export async function getDuckDBClient(
    config?: WorkerClientConfig
): Promise<DuckDBWorkerClient> {
    if (!globalClient) {
        globalClient = new DuckDBWorkerClient(config);
    }
    await globalClient.readyState();
    return globalClient;
}

/**
 * Convenience function to execute a query
 */
export async function runQuery(
    sql: string,
    params?: unknown[]
): Promise<QueryResult> {
    const client = await getDuckDBClient();
    return client.query(sql, params);
}

/**
 * Load a Parquet file into DuckDB
 */
export async function loadParquet(
    name: string,
    data: Uint8Array
): Promise<void> {
    const client = await getDuckDBClient();
    await client.registerFile(name, data);
    await client.query(
        `CREATE TABLE ${name.replace(/[^a-zA-Z0-9]/g, '_')} AS SELECT * FROM read_parquet('${name}')`
    );
}

/**
 * Load a CSV file into DuckDB
 */
export async function loadCSV(
    name: string,
    data: Uint8Array,
    options?: { delimiter?: string; header?: boolean }
): Promise<void> {
    const client = await getDuckDBClient();
    await client.registerFile(name, data);
    const delimiter = options?.delimiter ?? ',';
    const header = options?.header ?? true;
    const tableName = name.replace(/[^a-zA-Z0-9]/g, '_');
    await client.query(
        `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${name}', delimiter='${delimiter}', header=${header})`
    );
}
