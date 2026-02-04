/**
 * WASM Point-in-Polygon Service
 *
 * TypeScript bindings for the Rust WASM point-in-polygon spatial index.
 * Provides client-side geospatial queries with R-Tree acceleration.
 */

import init, {
    SpatialIndex,
    type MapsPipWasmModule,
} from './pkg/maps_pip_wasm';

// WASM module instance
let wasmModule: MapsPipWasmModule | null = null;

/**
 * Initialize the WASM module
 */
export async function initPipWasm(): Promise<MapsPipWasmModule> {
    if (!wasmModule) {
        wasmModule = await init();
    }
    return wasmModule;
}

/**
 * Coordinate pair for polygon vertices
 */
export interface Coordinate {
    x: number;
    y: number;
}

/**
 * Polygon with metadata for spatial queries
 */
export interface PolygonData {
    id: string;
    rings: Coordinate[];
    properties?: Record<string, unknown>;
}

/**
 * Point query request
 */
export interface PointQuery {
    x: number;
    y: number;
}

/**
 * Point query response
 */
export interface PointQueryResult {
    found: boolean;
    polygon_id: string | null;
    query_time_us: number;
    candidates_checked: number;
}

/**
 * Batch query result
 */
export interface BatchQueryResult {
    results: PointQueryResult[];
    total_time_us: number;
}

/**
 * Statistics about the spatial index
 */
export interface IndexStats {
    polygon_count: number;
    estimated_size_bytes: number;
}

/**
 * WASM-backed spatial index for point-in-polygon queries
 */
export class PipSpatialIndex {
    private index: SpatialIndex;
    private loaded: boolean = false;

    constructor() {
        this.index = new SpatialIndex();
    }

    /**
     * Clear all polygons from the index
     */
    clear(): void {
        this.index.clear();
        this.loaded = false;
    }

    /**
     * Get the number of polygons in the index
     */
    size(): number {
        return this.index.len();
    }

    /**
     * Check if the index is empty
     */
    empty(): boolean {
        return this.index.is_empty();
    }

    /**
     * Add a single polygon to the index
     */
    async addPolygon(id: string, rings: Coordinate[]): Promise<void> {
        await this.index.add_polygon(id, rings);
    }

    /**
     * Add multiple polygons to the index
     */
    async addPolygons(polygons: PolygonData[]): Promise<void> {
        await this.index.add_polygons(polygons);
        this.loaded = true;
    }

    /**
     * Query a single point
     */
    query(x: number, y: number): PointQueryResult {
        return this.index.query(x, y);
    }

    /**
     * Query multiple points
     */
    queryBatch(points: PointQuery[]): BatchQueryResult {
        return this.index.query_batch(points);
    }

    /**
     * Get statistics about the index
     */
    getStats(): IndexStats {
        return this.index.stats();
    }

    /**
     * Export the index as JSON
     */
    export(): PolygonData[] {
        return this.index.export();
    }

    /**
     * Import polygons from JSON
     */
    async import(data: PolygonData[]): Promise<void> {
        await this.index.import_data(data);
        this.loaded = true;
    }

    /**
     * Check if the index has data loaded
     */
    isLoaded(): boolean {
        return this.loaded;
    }
}

/**
 * Singleton instance of the spatial index
 */
let globalIndex: PipSpatialIndex | null = null;

/**
 * Get or create the global spatial index instance
 */
export async function getPipIndex(): Promise<PipSpatialIndex> {
    if (!globalIndex) {
        await initPipWasm();
        globalIndex = new PipSpatialIndex();
    }
    return globalIndex;
}

/**
 * Load GeoJSON features into the spatial index
 */
export async function loadGeoJSON(
    geojson: GeoJSON.FeatureCollection,
    options: { idProperty?: string; batchSize?: number } = {}
): Promise<PipSpatialIndex> {
    const { idProperty = 'id', batchSize = 1000 } = options;
    const index = await getPipIndex();

    // Convert GeoJSON to internal format
    const polygons: PolygonData[] = [];

    for (const feature of geojson.features) {
        if (
            feature.geometry.type !== 'Polygon' &&
            feature.geometry.type !== 'MultiPolygon'
        ) {
            continue;
        }

        const geometry = feature.geometry as
            | GeoJSON.Polygon
            | GeoJSON.MultiPolygon;

        if (geometry.type === 'Polygon') {
            const rings = convertRing(geometry.coordinates[0]);
            const id =
                (feature.properties as Record<string, unknown>)?.[
                    idProperty
                ]?.toString() ||
                feature.id?.toString() ||
                `polygon-${polygons.length}`;

            polygons.push({
                id,
                rings,
                properties: feature.properties || undefined,
            });
        } else if (geometry.type === 'MultiPolygon') {
            // Combine all rings from MultiPolygon
            for (const [idx, polygon] of geometry.coordinates.entries()) {
                const rings = convertRing(polygon[0]);
                const id =
                    (feature.properties as Record<string, unknown>)?.[
                        idProperty
                    ]?.toString() ||
                    `${feature.id?.toString() || 'multipolygon'}-${idx}`;

                polygons.push({
                    id,
                    rings,
                    properties: feature.properties || undefined,
                });
            }
        }

        // Batch load to avoid memory issues
        if (polygons.length >= batchSize) {
            await index.addPolygons(polygons);
            polygons.length = 0;
        }
    }

    // Load remaining polygons
    if (polygons.length > 0) {
        await index.addPolygons(polygons);
    }

    return index;
}

/**
 * Convert GeoJSON ring to Coordinate array
 */
function convertRing(ring: GeoJSON.Position[]): Coordinate[] {
    return ring.map(([x, y]) => ({ x, y }));
}

/**
 * Check if a point is inside any polygon in a GeoJSON FeatureCollection
 */
export async function pointInGeoJSON(
    geojson: GeoJSON.FeatureCollection,
    x: number,
    y: number,
    options: { idProperty?: string } = {}
): Promise<PointQueryResult> {
    const index = await loadGeoJSON(geojson, options);
    return index.query(x, y);
}

/**
 * Check multiple points against a GeoJSON FeatureCollection
 */
export async function batchPointInGeoJSON(
    geojson: GeoJSON.FeatureCollection,
    points: PointQuery[],
    options: { idProperty?: string } = {}
): Promise<BatchQueryResult> {
    const index = await loadGeoJSON(geojson, options);
    return index.queryBatch(points);
}

export { SpatialIndex };
