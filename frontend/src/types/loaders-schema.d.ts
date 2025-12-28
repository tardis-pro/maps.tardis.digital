declare module '@loaders.gl/schema' {
    export interface Schema {
        fields: SchemaField[];
        metadata?: Record<string, string>;
    }

    export interface SchemaField {
        name: string;
        type: DataType;
        nullable?: boolean;
        metadata?: Record<string, string>;
    }

    export type DataType =
        | 'bool'
        | 'int8'
        | 'int16'
        | 'int32'
        | 'int64'
        | 'uint8'
        | 'uint16'
        | 'uint32'
        | 'uint64'
        | 'float16'
        | 'float32'
        | 'float64'
        | 'utf8'
        | 'binary'
        | 'date-day'
        | 'date-millisecond'
        | 'time-second'
        | 'time-millisecond'
        | 'timestamp-second'
        | 'timestamp-millisecond';

    export interface Table {
        schema: Schema;
        length: number;
        data: Record<string, unknown[]>;
    }

    export interface TableBatch {
        schema: Schema;
        length: number;
        data: Record<string, unknown[]>;
        cursor?: number;
    }
}
