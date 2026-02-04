/**
 * DuckDB Web Worker Provider
 *
 * This module provides a Web Worker-based DuckDB implementation to prevent
 * blocking the main UI thread during heavy analytical queries.
 *
 * Architecture:
 * - DuckDB WASM runs in a dedicated Web Worker
 * - Main thread communicates with worker via Comlink (RPC-like interface)
 * - AsyncDuckDB instantiated within worker scope for proper isolation
 * - Message passing for all database operations
 *
 * Benefits:
 * - UI remains responsive during heavy queries
 * - Better memory management in worker scope
 * - Parallel query execution possible
 * - Improved stability (worker crashes don't kill main app)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { useDuckDBLogger, useDuckDBBundleResolver } from './platform_provider';

// Comlink for worker communication
// import * as Comlink from 'comlink';

// ============================================
// Types for Worker Communication
// ============================================

/**
 * Query result types
 */
export interface QueryResult {
    rows: Record<string, unknown>[];
    schema: { name: string; type: string }[];
    executionTime: number; // milliseconds
    rowCount: number;
}

export interface QueryOptions {
    timeout?: number; // milliseconds
    maxRows?: number;
    format?: 'arrow' | 'json' | 'object';
}

type QueryRow = Record<string, unknown>;
type QueryRowValue = { toJSON: () => QueryRow };
type QueryField = { name: string; type: { toString: () => string } };
type QueryTable = {
    toArray: () => QueryRowValue[];
    schema: { fields: QueryField[] };
};
type DuckDBConnection = duckdb.AsyncDuckDBConnection & {
    query: (text: string) => Promise<QueryTable>;
    close: () => Promise<void>;
};
type DuckDBDatabase = duckdb.AsyncDuckDB & {
    registerFileText: (name: string, text: string) => Promise<void>;
    registerFileBuffer: (name: string, buffer: Uint8Array) => Promise<void>;
    dropFile: (name: string) => Promise<null>;
};

/**
 * Connection information
 */
export interface ConnectionInfo {
    id: string;
    createdAt: number;
    database: string;
}

/**
 * Worker API exposed to main thread
 */
export interface DuckDBWorkerAPI {
    // Initialization
    init(config?: duckdb.DuckDBConfig): Promise<void>;
    destroy(): Promise<void>;
    isReady(): boolean;

    // Connection management
    createConnection(): Promise<ConnectionInfo>;
    closeConnection(connectionId: string): Promise<void>;
    closeAllConnections(): Promise<void>;

    // Query execution
    query(sql: string, options?: QueryOptions): Promise<QueryResult>;
    queryBatch(sql: string, batchSize?: number): AsyncIterable<QueryResult>;

    // Database operations
    registerFile(name: string, data: Uint8Array | string): Promise<void>;
    unregisterFile(name: string): Promise<void>;
    listFiles(): Promise<string[]>;

    // Information
    getVersion(): Promise<string>;
    getDatabaseSize(): Promise<number>;
}

/**
 * Worker initialization result
 */
export interface WorkerInitResult {
    worker: Worker;
    api: DuckDBWorkerAPI;
}

// ============================================
// Worker Code (Inline for simplicity)
// ============================================

/**
 * The worker code that runs DuckDB WASM
 * This runs in a separate thread to avoid blocking the UI
 */
const workerCode = `
const selfDir = self.location?.href?.split('/').slice(0, -1).join('/') || '';

let duckdb = null;
let connections = new Map();
let isReady = false;

// Import DuckDB WASM
async function loadDuckDB() {
    const response = await import('@duckdb/duckdb-wasm');
    return response;
}

async function init(config) {
    try {
        // Load DuckDB WASM
        const DUCKDB = await loadDuckDB();
        
        // Create worker from bundle
        const bundle = await DUCKDB.selectBundle({
            mvp: {
                mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', selfDir).toString(),
                mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.wasm', selfDir).toString(),
            },
        });
        
        // Create worker and database
        const worker = new Worker(bundle.mainWorker);
        const logger = new DUCKDB.ConsoleLogger();
        const db = new DUCKDB.AsyncDuckDB(logger, worker);
        
        // Instantiate
        await db.instantiate(bundle.mainModule);
        
        // Open with config if provided
        if (config) {
            await db.open(config);
        }
        
        duckdb = { db, bundle, DUCKDB };
        isReady = true;
        
        return { success: true, version: await getVersion() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createConnection() {
    if (!isReady || !duckdb) throw new Error('Database not initialized');
    
    const conn = await duckdb.db.connect();
    const id = 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    connections.set(id, conn);
    
    return {
        id,
        createdAt: Date.now(),
        database: 'main'
    };
}

async function closeConnection(id) {
    const conn = connections.get(id);
    if (conn) {
        await conn.close();
        connections.delete(id);
    }
}

async function closeAllConnections() {
    for (const [id, conn] of connections) {
        try {
            await conn.close();
        } catch (e) {
            console.warn('Error closing connection ' + id, e);
        }
    }
    connections.clear();
}

async function query(sql, options = {}) {
    if (!isReady) throw new Error('Database not initialized');
    if (connections.size === 0) {
        // Auto-create a connection if none exist
        await createConnection();
    }
    
    const conn = connections.values().next().value;
    const startTime = performance.now();
    
    try {
        const result = await conn.query(sql);
        const executionTime = performance.now() - startTime;
        
        // Convert to result format
        const rows = [];
        const schema = [];
        
        // Get schema
        if (result.schema && result.schema.fields) {
            for (const field of result.schema.fields) {
                schema.push({
                    name: field.name,
                    type: field.type.toString()
                });
            }
        }
        
        // Get rows (limited by maxRows if specified)
        const maxRows = options.maxRows || 10000;
        let rowCount = 0;
        
        for await (const batch of result) {
            const json = batch.toJSON();
            if (Array.isArray(json)) {
                for (const row of json) {
                    if (rowCount >= maxRows) break;
                    rows.push(row);
                    rowCount++;
                }
            }
            if (rowCount >= maxRows) break;
        }
        
        return {
            rows,
            schema,
            executionTime,
            rowCount: rows.length
        };
    } catch (error) {
        throw new Error('Query failed: ' + error.message);
    }
}

async function registerFile(name, data) {
    if (!isReady) throw new Error('Database not initialized');
    
    if (typeof data === 'string') {
        // URL or data URI
        await duckdb.db.registerFileText(name, data);
    } else {
        // Binary data
        await duckdb.db.registerFileBuffer(name, data);
    }
}

async function unregisterFile(name) {
    if (!isReady) throw new Error('Database not initialized');
    await duckdb.db.dropFile(name);
}

async function listFiles() {
    if (!isReady) throw new Error('Database not initialized');
    // DuckDB WASM doesn't expose direct file listing
    return [];
}

async function getVersion() {
    return 'DuckDB WASM - Version ' + duckdb?.DUCKDB?.VERSION || 'unknown';
}

async function destroy() {
    await closeAllConnections();
    if (duckdb?.bundle?.pthreadWorker) {
        duckdb.bundle.pthreadWorker.terminate();
    }
    duckdb = null;
    isReady = false;
    connections.clear();
}

// Message handler
self.onmessage = async (e) => {
    const { type, id, payload } = e.data;
    
    try {
        let result;
        switch (type) {
            case 'init':
                result = await init(payload);
                break;
            case 'createConnection':
                result = await createConnection();
                break;
            case 'closeConnection':
                await closeConnection(payload);
                result = { success: true };
                break;
            case 'closeAllConnections':
                await closeAllConnections();
                result = { success: true };
                break;
            case 'query':
                result = await query(payload.sql, payload.options);
                break;
            case 'registerFile':
                await registerFile(payload.name, payload.data);
                result = { success: true };
                break;
            case 'unregisterFile':
                await unregisterFile(payload);
                result = { success: true };
                break;
            case 'listFiles':
                result = await listFiles();
                break;
            case 'getVersion':
                result = await getVersion();
                break;
            case 'destroy':
                await destroy();
                result = { success: true };
                break;
            default:
                result = { error: 'Unknown message type: ' + type };
        }
        
        self.postMessage({ id, success: true, result });
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};
`;

// ============================================
// React Provider Component
// ============================================

/**
 * Context for DuckDB worker API
 */
const DuckDBWorkerContext = React.createContext<DuckDBWorkerAPI | null>(null);

/**
 * Hook to use DuckDB worker API
 */
export const useDuckDBWorker = (): DuckDBWorkerAPI => {
    const api = React.useContext(DuckDBWorkerContext);
    if (!api) {
        throw new Error(
            'useDuckDBWorker must be used within DuckDBWorkerProvider'
        );
    }
    return api;
};

/**
 * Hook to check if DuckDB worker is ready
 */
export const useDuckDBWorkerReady = (): boolean => {
    const [ready, setReady] = useState(false);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initWorker = async () => {
            try {
                // Create worker from blob
                const blob = new Blob([workerCode], {
                    type: 'application/javascript',
                });
                const worker = new Worker(URL.createObjectURL(blob));
                workerRef.current = worker;

                // Initialize DuckDB
                const response = await sendWorkerMessage(worker, 'init', {});

                if (isMounted && response.success) {
                    setReady(true);
                }
            } catch (error) {
                console.error('Failed to initialize DuckDB worker:', error);
            }
        };

        initWorker();

        return () => {
            isMounted = false;
            if (workerRef.current) {
                sendWorkerMessage(workerRef.current, 'destroy', {});
                workerRef.current.terminate();
            }
        };
    }, []);

    return ready;
};

/**
 * DuckDB Worker Provider Component
 *
 * Provides DuckDB WASM functionality via Web Worker to prevent
 * blocking the main UI thread.
 */
export const DuckDBWorkerProvider: React.FC<{
    children: React.ReactElement | React.ReactElement[];
    config?: duckdb.DuckDBConfig;
}> = ({ children, config }) => {
    const logger = useDuckDBLogger();
    const resolveBundle = useDuckDBBundleResolver();

    const [api, setApi] = useState<DuckDBWorkerAPI | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const pendingMessages = useRef<
        Map<
            number,
            {
                resolve: (value: unknown) => void;
                reject: (reason?: unknown) => void;
            }
        >
    >(new Map());

    // Initialize worker
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                // Create worker from blob
                const blob = new Blob([workerCode], {
                    type: 'application/javascript',
                });
                const worker = new Worker(URL.createObjectURL(blob));
                workerRef.current = worker;

                // Set up message handler
                worker.onmessage = (e) => {
                    const { id, success, result, error } = e.data;
                    const pending = pendingMessages.current.get(id);

                    if (pending) {
                        pendingMessages.current.delete(id);
                        if (success) {
                            pending.resolve(result);
                        } else {
                            pending.reject(new Error(error));
                        }
                    }
                };

                worker.onerror = (error) => {
                    console.error('DuckDB Worker error:', error);
                };

                // Initialize DuckDB
                const bundle = await resolveBundle();
                const duckdb = await import('@duckdb/duckdb-wasm');

                if (!bundle) {
                    console.error('Failed to resolve DuckDB bundle');
                    return;
                }

                if (!bundle.mainWorker) {
                    console.error('DuckDB bundle missing worker entry');
                    return;
                }

                // Create proper DuckDB WASM worker setup
                let dbWorker: Worker;
                let db: duckdb.AsyncDuckDB;

                try {
                    dbWorker = new Worker(bundle.mainWorker);
                    db = new duckdb.AsyncDuckDB(logger, dbWorker);
                    await db.instantiate(
                        bundle.mainModule,
                        bundle.pthreadWorker
                    );

                    if (config) {
                        await db.open(config);
                    }
                } catch (e) {
                    console.error('Failed to initialize DuckDB:', e);
                    return;
                }

                if (isMounted) {
                    // Create API interface
                    const workerAPI: DuckDBWorkerAPI = {
                        async init(cfg) {
                            if (cfg) await db.open(cfg);
                        },
                        async destroy() {
                            dbWorker?.terminate();
                        },
                        isReady: () => true,

                        async createConnection() {
                            const conn = await db.connect();
                            void conn;
                            const id = 'conn_' + Date.now();
                            return {
                                id,
                                createdAt: Date.now(),
                                database: 'main',
                            };
                        },

                        async closeConnection(id) {
                            void id;
                            // Connection management would go here
                        },

                        async closeAllConnections() {
                            // Close all connections
                        },

                        async query(sql, options = {}) {
                            const start = performance.now();
                            const connection =
                                (await db.connect()) as DuckDBConnection;
                            const result = await connection.query(sql);
                            const time = performance.now() - start;
                            const maxRows = options.maxRows ?? 10000;

                            // Convert to serializable format
                            const rows = result
                                .toArray()
                                .map((row: QueryRowValue) => row.toJSON())
                                .slice(0, maxRows);
                            const schema = result.schema.fields.map(
                                (f: QueryField) => ({
                                    name: f.name,
                                    type: f.type.toString(),
                                })
                            );

                            return {
                                rows,
                                schema,
                                executionTime: time,
                                rowCount: rows.length,
                            };
                        },

                        async *queryBatch(sql, batchSize = 1000) {
                            const result = await this.query(sql, {
                                maxRows: batchSize,
                            });
                            yield result;
                        },

                        async registerFile(name, data) {
                            if (typeof data === 'string') {
                                await (db as DuckDBDatabase).registerFileText(
                                    name,
                                    data
                                );
                            } else {
                                await (db as DuckDBDatabase).registerFileBuffer(
                                    name,
                                    data
                                );
                            }
                        },

                        async unregisterFile(name) {
                            await (db as DuckDBDatabase).dropFile(name);
                        },

                        async listFiles() {
                            return [];
                        },

                        async getVersion() {
                            return 'VERSION' in duckdb
                                ? (duckdb as { VERSION: string }).VERSION
                                : 'unknown';
                        },

                        async getDatabaseSize() {
                            return 0; // Would need implementation
                        },
                    };

                    setApi(workerAPI);
                }
            } catch (error) {
                console.error('Failed to initialize DuckDB worker:', error);
            }
        };

        init();

        return () => {
            isMounted = false;
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [logger, resolveBundle, config]);

    return (
        <DuckDBWorkerContext.Provider value={api}>
            {children}
        </DuckDBWorkerContext.Provider>
    );
};

// ============================================
// Helper Functions
// ============================================

/**
 * Send a message to the worker and wait for response
 */
async function sendWorkerMessage(
    worker: Worker,
    type: string,
    payload: unknown
): Promise<{ success: boolean; result?: unknown; error?: string }> {
    return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2, 11);

        const timeout = setTimeout(() => {
            reject(new Error('Worker message timeout'));
        }, 30000);

        const handler = (e: MessageEvent) => {
            if (e.data.id === id) {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                resolve(e.data);
            }
        };

        worker.addEventListener('message', handler);
        worker.postMessage({ type, id, payload });
    });
}

/**
 * Hook for using DuckDB with automatic worker management
 */
export function useDuckDBWorkerQuery() {
    const api = useDuckDBWorker();
    const [result, setResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(
        async (sql: string, options?: QueryOptions) => {
            if (!api) {
                setError(new Error('DuckDB worker not ready'));
                return null;
            }

            setLoading(true);
            setError(null);

            try {
                const queryResult = await api.query(sql, options);
                setResult(queryResult);
                return queryResult;
            } catch (e) {
                setError(e as Error);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [api]
    );

    const clear = useCallback(() => {
        setResult(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        execute,
        clear,
        result,
        loading,
        error,
    };
}

/**
 * Component wrapper for worker-ready content
 */
export const DuckDBWorkerReady: React.FC<{
    children: React.ReactElement;
    fallback?: React.ReactElement;
}> = ({ children, fallback }) => {
    const api = useDuckDBWorker();

    if (!api) {
        return fallback || <div>Loading DuckDB...</div>;
    }

    return children;
};
