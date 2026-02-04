/**
 * DuckDB Web Worker
 *
 * Dedicated Web Worker for DuckDB WASM operations.
 * Ensures all database queries run off the main UI thread.
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import type {
    DuckDBConfig,
    AsyncDuckDB,
    AsyncDuckDBConnection,
    RowDataType,
} from '@duckdb/duckdb-wasm';

type WorkerMessage =
    | { type: 'init'; config?: DuckDBConfig }
    | { type: 'query'; query: string; params?: unknown[] }
    | { type: 'registerFile'; name: string; data: Uint8Array }
    | { type: 'insertArrow'; name: string; arrow: Uint8Array }
    | { type: 'close' }
    | { type: 'ping' };

type WorkerResponse =
    | { type: 'ready'; version: string }
    | { type: 'result'; data: RowDataType[]; types: ColumnType[] }
    | { type: 'error'; message: string }
    | { type: 'pong' }
    | { type: 'progress'; value: number };

interface ColumnType {
    columnName: string;
    columnType: duckdb.DuckDataType;
}

let db: AsyncDuckDB | null = null;
let conn: AsyncDuckDBConnection | null = null;
let bundle: duckdb.DuckDBBundle | null = null;

// Initialize the worker
async function init(config?: DuckDBConfig): Promise<void> {
    try {
        // Load DuckDB WASM bundles
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // Set up web worker for DuckDB
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();

        // Create AsyncDuckDB instance
        db = new AsyncDuckDB(logger, worker);

        // Instantiate the database
        await db.instantiate(
            bundle.mainModule,
            bundle.pthreadWorker,
            (progress) => {
                postMessage({ type: 'progress', value: progress });
            }
        );

        // Open database with config if provided
        if (config) {
            await db.open(config);
        }

        // Create a connection for queries
        conn = await db.connect();

        // Send ready message
        postMessage({
            type: 'ready',
            version: db.getVersion(),
        });
    } catch (error) {
        postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

// Execute a query
async function query(sql: string, params?: unknown[]): Promise<void> {
    if (!conn) {
        postMessage({ type: 'error', message: 'Database not initialized' });
        return;
    }

    try {
        // Execute query and get result as arrow
        const result = await conn.query(sql, params);

        // Convert to row data
        const rows = result.toArray().map((row) => row.toJSON());

        // Get column types
        const columns = result.schema.fields.map((field) => ({
            columnName: field.name,
            columnType: field.type,
        }));

        postMessage({
            type: 'result',
            data: rows,
            types: columns,
        });
    } catch (error) {
        postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'Query failed',
        });
    }
}

// Register a file in the database
async function registerFile(name: string, data: Uint8Array): Promise<void> {
    if (!db) {
        postMessage({ type: 'error', message: 'Database not initialized' });
        return;
    }

    try {
        await db.registerFileFromArrayBuffer(name, data);
        postMessage({
            type: 'result',
            data: [{ success: true, name }],
            types: [],
        });
    } catch (error) {
        postMessage({
            type: 'error',
            message:
                error instanceof Error
                    ? error.message
                    : 'File registration failed',
        });
    }
}

// Insert Arrow data
async function insertArrow(name: string, arrow: Uint8Array): Promise<void> {
    if (!db || !conn) {
        postMessage({ type: 'error', message: 'Database not initialized' });
        return;
    }

    try {
        // Create an Arrow table from the data
        await conn.insertArrowFromLocalFile(name, []);
        postMessage({
            type: 'result',
            data: [{ success: true, name }],
            types: [],
        });
    } catch (error) {
        postMessage({
            type: 'error',
            message:
                error instanceof Error ? error.message : 'Arrow insert failed',
        });
    }
}

// Close the database
async function close(): Promise<void> {
    if (conn) {
        await conn.close();
        conn = null;
    }
    if (db) {
        await db.terminate();
        db = null;
    }
    postMessage({ type: 'result', data: [{ closed: true }], types: [] });
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type } = event.data;

    switch (type) {
        case 'init':
            await init(event.data.config);
            break;
        case 'query':
            await query(event.data.query, event.data.params);
            break;
        case 'registerFile':
            await registerFile(event.data.name, event.data.data);
            break;
        case 'insertArrow':
            await insertArrow(event.data.name, event.data.arrow);
            break;
        case 'close':
            await close();
            break;
        case 'ping':
            postMessage({ type: 'pong' });
            break;
        default:
            postMessage({
                type: 'error',
                message: `Unknown message type: ${type}`,
            });
    }
};
