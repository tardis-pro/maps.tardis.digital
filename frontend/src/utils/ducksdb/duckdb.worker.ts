/**
 * DuckDB Web Worker
 *
 * Dedicated Web Worker for DuckDB WASM operations.
 * Ensures all database queries run off the main UI thread.
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import type { DuckDBConfig } from '@duckdb/duckdb-wasm';

type WorkerMessage =
    | { type: 'init'; config?: DuckDBConfig }
    | { type: 'query'; query: string; params?: unknown[] }
    | { type: 'registerFile'; name: string; data: Uint8Array }
    | { type: 'insertArrow'; name: string; arrow: Uint8Array }
    | { type: 'close' }
    | { type: 'ping' };

interface ColumnType {
    columnName: string;
    columnType: string;
}

type QueryRow = Record<string, unknown>;
type QueryRowValue = { toJSON: () => QueryRow };
type QueryField = { name: string; type: { toString: () => string } };
type QueryTable = {
    toArray: () => QueryRowValue[];
    schema: { fields: QueryField[] };
};
type PreparedStatement = {
    query: (...params: unknown[]) => Promise<QueryTable>;
    close: () => Promise<void>;
};
type DuckDBConnection = duckdb.AsyncDuckDBConnection & {
    query: (text: string) => Promise<QueryTable>;
    prepare: (text: string) => Promise<PreparedStatement>;
    insertArrowFromIPCStream: (
        buffer: Uint8Array,
        options: { name: string }
    ) => Promise<void>;
    close: () => Promise<void>;
};
type DuckDBDatabase = duckdb.AsyncDuckDB & {
    registerFileBuffer: (name: string, buffer: Uint8Array) => Promise<void>;
    terminate: () => Promise<void>;
};

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let bundle: duckdb.DuckDBBundle | null = null;

async function runQuery(
    connection: DuckDBConnection,
    sql: string,
    params?: unknown[]
): Promise<QueryTable> {
    if (!params || params.length === 0) {
        return connection.query(sql);
    }

    const statement = await connection.prepare(sql);
    try {
        return await statement.query(...params);
    } finally {
        await statement.close();
    }
}

// Initialize the worker
async function init(config?: DuckDBConfig): Promise<void> {
    try {
        // Load DuckDB WASM bundles
        const bundles = {
            mvp: {
                mainModule: new URL(
                    '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.wasm',
                    import.meta.url
                ).toString(),
                mainWorker: new URL(
                    '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js',
                    import.meta.url
                ).toString(),
            },
            eh: {
                mainModule: new URL(
                    '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.wasm',
                    import.meta.url
                ).toString(),
                mainWorker: new URL(
                    '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js',
                    import.meta.url
                ).toString(),
                pthreadWorker: new URL(
                    '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.pthread.worker.js',
                    import.meta.url
                ).toString(),
            },
        } as duckdb.DuckDBBundles;

        bundle = await duckdb.selectBundle(bundles);

        // Set up web worker for DuckDB
        const worker = new Worker(bundle.mainWorker!);
        const logger: duckdb.Logger = {
            log: (...args: unknown[]) => console.log(...args),
            info: (...args: unknown[]) => console.info(...args),
            warn: (...args: unknown[]) => console.warn(...args),
            error: (...args: unknown[]) => console.error(...args),
            debug: (...args: unknown[]) => console.debug(...args),
        };

        // Create AsyncDuckDB instance
        db = new duckdb.AsyncDuckDB(logger, worker);

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
        const version =
            'VERSION' in duckdb
                ? (duckdb as { VERSION: string }).VERSION
                : 'unknown';

        postMessage({
            type: 'ready',
            version,
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
        const connection = conn as DuckDBConnection;
        const result = await runQuery(connection, sql, params);

        // Convert to row data
        const rows = result.toArray().map((row: QueryRowValue) => row.toJSON());

        // Get column types
        const columns: ColumnType[] = result.schema.fields.map(
            (field: QueryField) => ({
                columnName: field.name,
                columnType: field.type.toString(),
            })
        );

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
        await (db as DuckDBDatabase).registerFileBuffer(name, data);
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
        const connection = conn as DuckDBConnection;
        await connection.insertArrowFromIPCStream(arrow, { name });
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
        await (conn as DuckDBConnection).close();
        conn = null;
    }
    if (db) {
        await (db as DuckDBDatabase).terminate();
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
