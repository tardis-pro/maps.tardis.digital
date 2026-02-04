/**
 * DuckDB Worker Type Definitions
 *
 * Type definitions for the DuckDB Web Worker implementation.
 */

import * as duckdb from '@duckdb/duckdb-wasm';

/**
 * Worker API interface for DuckDB operations
 */
export interface DuckDBWorkerAPI {
    /**
     * Initialize the worker with optional config
     */
    init(config?: duckdb.DuckDBConfig): Promise<void>;

    /**
     * Destroy the worker and cleanup resources
     */
    destroy(): Promise<void>;

    /**
     * Check if worker is ready
     */
    isReady(): boolean;

    /**
     * Create a new database connection
     */
    createConnection(): Promise<ConnectionInfo>;

    /**
     * Close a specific connection
     */
    closeConnection(connectionId: string): Promise<void>;

    /**
     * Close all connections
     */
    closeAllConnections(): Promise<void>;

    /**
     * Execute a query and return results
     */
    query(sql: string, options?: QueryOptions): Promise<QueryResult>;

    /**
     * Execute a query and stream results in batches
     */
    queryBatch(sql: string, batchSize?: number): AsyncIterable<QueryResult>;

    /**
     * Register a file in the virtual file system
     */
    registerFile(name: string, data: Uint8Array | string): Promise<void>;

    /**
     * Unregister a file from the virtual file system
     */
    unregisterFile(name: string): Promise<void>;

    /**
     * List all registered files
     */
    listFiles(): Promise<string[]>;

    /**
     * Get DuckDB version
     */
    getVersion(): Promise<string>;

    /**
     * Get database size in bytes
     */
    getDatabaseSize(): Promise<number>;
}

/**
 * Query result interface
 */
export interface QueryResult {
    /**
     * Array of result rows as objects
     */
    rows: Record<string, unknown>[];

    /**
     * Column schema information
     */
    schema: { name: string; type: string }[];

    /**
     * Query execution time in milliseconds
     */
    executionTime: number;

    /**
     * Total number of rows returned
     */
    rowCount: number;
}

/**
 * Query options interface
 */
export interface QueryOptions {
    /**
     * Query timeout in milliseconds
     */
    timeout?: number;

    /**
     * Maximum number of rows to return
     */
    maxRows?: number;

    /**
     * Result format
     */
    format?: 'arrow' | 'json' | 'object';
}

/**
 * Connection information interface
 */
export interface ConnectionInfo {
    /**
     * Unique connection identifier
     */
    id: string;

    /**
     * Connection creation timestamp
     */
    createdAt: number;

    /**
     * Database name
     */
    database: string;
}

/**
 * Worker initialization options
 */
export interface WorkerInitOptions {
    /**
     * DuckDB configuration
     */
    config?: duckdb.DuckDBConfig;

    /**
     * Bundle selection for DuckDB WASM
     */
    bundle?: duckdb.DuckDBBundle;

    /**
     * Progress callback
     */
    onProgress?: (progress: duckdb.InstantiationProgress) => void;
}

/**
 * Worker status interface
 */
export interface WorkerStatus {
    /**
     * Whether worker is initialized
     */
    ready: boolean;

    /**
     * DuckDB version
     */
    version: string | null;

    /**
     * Number of active connections
     */
    connectionCount: number;

    /**
     * Memory usage estimate
     */
    memoryUsage: number | null;
}

/**
 * Registered file information
 */
export interface RegisteredFile {
    /**
     * File name
     */
    name: string;

    /**
     * File size in bytes
     */
    size: number;

    /**
     * File type
     */
    type: 'buffer' | 'text' | 'url';
}
