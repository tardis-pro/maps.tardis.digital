export interface Coordinate {
    x: number;
    y: number;
}

export interface PolygonData {
    id: string;
    rings: Coordinate[];
    properties?: Record<string, unknown>;
}

export interface PointQuery {
    x: number;
    y: number;
}

export interface PointQueryResult {
    found: boolean;
    polygon_id: string | null;
    query_time_us: number;
    candidates_checked: number;
}

export interface BatchQueryResult {
    results: PointQueryResult[];
    total_time_us: number;
}

export interface IndexStats {
    polygon_count: number;
    estimated_size_bytes: number;
}

export class SpatialIndex {
    clear(): void;
    len(): number;
    is_empty(): boolean;
    add_polygon(id: string, rings: Coordinate[]): Promise<void>;
    add_polygons(polygons: PolygonData[]): Promise<void>;
    query(x: number, y: number): PointQueryResult;
    query_batch(points: PointQuery[]): BatchQueryResult;
    stats(): IndexStats;
    export(): PolygonData[];
    import_data(data: PolygonData[]): Promise<void>;
}

export interface MapsPipWasmModule {
    SpatialIndex: typeof SpatialIndex;
}

export default function init(): Promise<MapsPipWasmModule>;
