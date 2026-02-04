/**
 * Hybrid Layer Manager
 *
 * Automatically selects between Vector Tiles (MVT) and Raster Tiles (COG)
 * based on dataset size for optimal performance.
 *
 * Performance thresholds:
 * - Small datasets (< 10k features): Vector tiles (MVT) - fast, interactive
 * - Medium datasets (10k - 100k features): Hybrid with clustering
 * - Large datasets (> 100k features): Raster tiles (COG) - server-side rendering
 */

import {
    LayerSpecification,
    SourceSpecification,
} from '@maplibre/maplibre-gl-style-spec';

export enum TileFormat {
    MVT = 'mvt',
    COG = 'cog',
    RASTER = 'raster',
}

export enum RenderStrategy {
    VECTOR = 'vector',
    HYBRID = 'hybrid',
    RASTER = 'raster',
}

export interface TilingConfig {
    /** Feature count below which vector tiles are used */
    vectorThreshold: number;
    /** Feature count above which raster tiles are used */
    rasterThreshold: number;
    /** Maximum features per vector tile */
    maxVectorTileFeatures: number;
    /** MVT tile server URL */
    vectorTilerUrl: string;
    /** COG tile server URL */
    rasterTilerUrl: string;
}

export interface TileInfo {
    sourceId: number;
    featureCount: number;
    recommendedStrategy: RenderStrategy;
    tileFormat: TileFormat;
    vectorThreshold: number;
    rasterThreshold: number;
    tileUrls: {
        vector: string;
        raster: string;
    };
}

export interface LayerConfig {
    id: string;
    sourceId: number;
    name: string;
    visible: boolean;
    opacity: number;
    strategy?: RenderStrategy;
}

const DEFAULT_CONFIG: TilingConfig = {
    vectorThreshold: 10_000,
    rasterThreshold: 100_000,
    maxVectorTileFeatures: 50_000,
    vectorTilerUrl: 'http://localhost:3000',
    rasterTilerUrl: 'http://localhost:9000',
};

export class HybridLayerManager {
    private config: TilingConfig;
    private tileInfoCache: Map<number, TileInfo> = new Map();
    private activeLayers: Map<string, LayerConfig> = new Map();

    constructor(config: Partial<TilingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Get cached tile info for a source
     */
    getTileInfo(sourceId: number): TileInfo | undefined {
        return this.tileInfoCache.get(sourceId);
    }

    /**
     * Cache tile info from API response
     */
    setTileInfo(sourceId: number, info: TileInfo): void {
        this.tileInfoCache.set(sourceId, info);
    }

    /**
     * Determine the optimal rendering strategy
     */
    determineStrategy(
        featureCount: number,
        zoomLevel: number,
        viewportFeatures?: number
    ): RenderStrategy {
        // Small datasets always use vector tiles
        if (featureCount < this.config.vectorThreshold) {
            return RenderStrategy.VECTOR;
        }

        // Large datasets always use raster tiles
        if (featureCount > this.config.rasterThreshold) {
            return RenderStrategy.RASTER;
        }

        // Medium datasets: decide based on zoom
        if (zoomLevel <= 6) {
            // Continent/country level - hybrid with clustering
            return RenderStrategy.HYBRID;
        } else if (zoomLevel >= 15) {
            // Street level - switch to raster
            return RenderStrategy.RASTER;
        } else {
            // City/neighborhood level - hybrid
            return RenderStrategy.HYBRID;
        }
    }

    /**
     * Get the appropriate source configuration based on strategy
     */
    getSourceConfig(
        sourceId: number,
        strategy: RenderStrategy
    ): SourceSpecification {
        if (strategy === RenderStrategy.RASTER) {
            // Raster source (COG)
            return {
                type: 'raster',
                tiles: [
                    `${this.config.rasterTilerUrl}/tiles/{z}/{x}/{y}?url=postgresql://...`,
                ],
                tileSize: 256,
                scheme: 'xyz',
            };
        } else {
            // Vector source (MVT)
            return {
                type: 'vector',
                tiles: [
                    `${this.config.vectorTilerUrl}/tile?source=${sourceId}&z={z}&x={x}&y={y}`,
                ],
                minzoom: 0,
                maxzoom: 22,
            };
        }
    }

    /**
     * Get layer configuration based on strategy
     */
    getLayerConfig(
        layerId: string,
        sourceId: number,
        strategy: RenderStrategy,
        options: {
            visible?: boolean;
            opacity?: number;
            paint?: Record<string, unknown>;
        } = {}
    ): LayerSpecification {
        const { visible = true, opacity = 1, paint = {} } = options;

        if (strategy === RenderStrategy.RASTER) {
            // Raster layer for large datasets
            return {
                id: layerId,
                type: 'raster',
                source: `source-${sourceId}`,
                paint: {
                    'raster-opacity': opacity,
                    'raster-brightness-max': 1,
                    'raster-brightness-min': 0,
                    ...paint,
                },
                layout: {
                    visibility: visible ? 'visible' : 'none',
                },
            };
        } else {
            // Vector layer for small/medium datasets
            return {
                id: layerId,
                type: 'fill',
                source: `source-${sourceId}`,
                'source-layer': 'layer',
                paint: {
                    'fill-opacity': opacity,
                    'fill-color': '#3b82f6',
                    'fill-outline-color': '#1d4ed8',
                    ...paint,
                },
                layout: {
                    visibility: visible ? 'visible' : 'none',
                },
            };
        }
    }

    /**
     * Get clustering configuration for hybrid mode
     */
    getClusterConfig(sourceId: number): Record<string, unknown> {
        return {
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
            clusterProperties: {
                sum: ['+', ['get', 'point_count']],
            },
            clusterOnLayer: true,
        };
    }

    /**
     * Create a complete layer setup for a source
     */
    createLayerSetup(
        sourceId: number,
        layerName: string,
        options: {
            visible?: boolean;
            opacity?: number;
            featureCount?: number;
            zoomLevel?: number;
        } = {}
    ): {
        source: SourceSpecification;
        layers: LayerSpecification[];
        strategy: RenderStrategy;
    } {
        const featureCount = options.featureCount ?? 50000;
        const zoomLevel = options.zoomLevel ?? 10;
        const visible = options.visible ?? true;
        const opacity = options.opacity ?? 1;

        const strategy = this.determineStrategy(featureCount, zoomLevel);
        const source = this.getSourceConfig(sourceId, strategy);

        const baseLayer = this.getLayerConfig(
            `layer-${sourceId}`,
            sourceId,
            strategy,
            { visible, opacity }
        );

        const layers: LayerSpecification[] = [baseLayer];

        // Add clustering layers for hybrid mode
        if (strategy === RenderStrategy.HYBRID) {
            layers.push({
                id: `cluster-${sourceId}`,
                type: 'circle',
                source: `source-${sourceId}`,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#51bbd6',
                        100,
                        '#f1f075',
                        750,
                        '#f28cb1',
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,
                        100,
                        30,
                        750,
                        40,
                    ],
                },
            });

            layers.push({
                id: `cluster-count-${sourceId}`,
                type: 'symbol',
                source: `source-${sourceId}`,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': [
                        'DIN Offc Pro Medium',
                        'Arial Unicode MS Bold',
                    ],
                    'text-size': 12,
                },
            });
        }

        return { source, layers, strategy };
    }

    /**
     * Register an active layer
     */
    registerLayer(config: LayerConfig): void {
        this.activeLayers.set(config.id, config);
    }

    /**
     * Unregister a layer
     */
    unregisterLayer(layerId: string): void {
        this.activeLayers.delete(layerId);
    }

    /**
     * Get all active layers
     */
    getActiveLayers(): LayerConfig[] {
        return Array.from(this.activeLayers.values());
    }

    /**
     * Update layer visibility
     */
    setLayerVisibility(layerId: string, visible: boolean): void {
        const layer = this.activeLayers.get(layerId);
        if (layer) {
            layer.visible = visible;
        }
    }

    /**
     * Update layer opacity
     */
    setLayerOpacity(layerId: string, opacity: number): void {
        const layer = this.activeLayers.get(layerId);
        if (layer) {
            layer.opacity = opacity;
        }
    }

    /**
     * Get tile URL for a specific strategy
     */
    getTileUrl(
        sourceId: number,
        z: number,
        x: number,
        y: number,
        strategy?: RenderStrategy
    ): string {
        const info = this.tileInfoCache.get(sourceId);
        const actualStrategy =
            strategy ?? info?.recommendedStrategy ?? RenderStrategy.VECTOR;

        if (actualStrategy === RenderStrategy.RASTER) {
            return `${this.config.rasterTilerUrl}/tiles/${z}/${x}/${y}`;
        }
        return `${this.config.vectorTilerUrl}/tile?source=${sourceId}&z=${z}&x=${x}&y=${y}`;
    }

    /**
     * Get the current configuration
     */
    getConfig(): TilingConfig {
        return { ...this.config };
    }

    /**
     * Update configuration at runtime
     */
    updateConfig(updates: Partial<TilingConfig>): void {
        this.config = { ...this.config, ...updates };
    }
}

// Singleton instance for convenience
let layerManagerInstance: HybridLayerManager | null = null;

export function getLayerManager(): HybridLayerManager {
    if (!layerManagerInstance) {
        layerManagerInstance = new HybridLayerManager();
    }
    return layerManagerInstance;
}

export function createLayerManager(
    config?: Partial<TilingConfig>
): HybridLayerManager {
    return new HybridLayerManager(config);
}
