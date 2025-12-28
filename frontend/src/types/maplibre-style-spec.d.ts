declare module '@maplibre/maplibre-gl-style-spec' {
    export interface StyleSpecification {
        version: number;
        name?: string;
        metadata?: Record<string, unknown>;
        center?: [number, number];
        zoom?: number;
        bearing?: number;
        pitch?: number;
        light?: LightSpecification;
        sources: Record<string, SourceSpecification>;
        sprite?: string;
        glyphs?: string;
        layers: LayerSpecification[];
    }

    export interface LightSpecification {
        anchor?: 'map' | 'viewport';
        color?: string;
        intensity?: number;
        position?: [number, number, number];
    }

    export type SourceSpecification =
        | VectorSourceSpecification
        | RasterSourceSpecification
        | RasterDEMSourceSpecification
        | GeoJSONSourceSpecification
        | ImageSourceSpecification
        | VideoSourceSpecification;

    export interface VectorSourceSpecification {
        type: 'vector';
        url?: string;
        tiles?: string[];
        bounds?: [number, number, number, number];
        scheme?: 'xyz' | 'tms';
        minzoom?: number;
        maxzoom?: number;
        attribution?: string;
        promoteId?: string | Record<string, string>;
        volatile?: boolean;
    }

    export interface RasterSourceSpecification {
        type: 'raster';
        url?: string;
        tiles?: string[];
        bounds?: [number, number, number, number];
        minzoom?: number;
        maxzoom?: number;
        tileSize?: number;
        scheme?: 'xyz' | 'tms';
        attribution?: string;
        volatile?: boolean;
    }

    export interface RasterDEMSourceSpecification {
        type: 'raster-dem';
        url?: string;
        tiles?: string[];
        bounds?: [number, number, number, number];
        minzoom?: number;
        maxzoom?: number;
        tileSize?: number;
        attribution?: string;
        encoding?: 'terrarium' | 'mapbox';
        volatile?: boolean;
    }

    export interface GeoJSONSourceSpecification {
        type: 'geojson';
        data?: object | string;
        maxzoom?: number;
        attribution?: string;
        buffer?: number;
        filter?: unknown;
        tolerance?: number;
        cluster?: boolean;
        clusterRadius?: number;
        clusterMaxZoom?: number;
        clusterMinPoints?: number;
        clusterProperties?: Record<string, unknown>;
        lineMetrics?: boolean;
        generateId?: boolean;
        promoteId?: string;
    }

    export interface ImageSourceSpecification {
        type: 'image';
        url: string;
        coordinates: [
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ];
    }

    export interface VideoSourceSpecification {
        type: 'video';
        urls: string[];
        coordinates: [
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ];
    }

    export type LayerSpecification =
        | FillLayerSpecification
        | LineLayerSpecification
        | SymbolLayerSpecification
        | CircleLayerSpecification
        | HeatmapLayerSpecification
        | FillExtrusionLayerSpecification
        | RasterLayerSpecification
        | HillshadeLayerSpecification
        | BackgroundLayerSpecification;

    export interface FillLayerSpecification {
        id: string;
        type: 'fill';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface LineLayerSpecification {
        id: string;
        type: 'line';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface SymbolLayerSpecification {
        id: string;
        type: 'symbol';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface CircleLayerSpecification {
        id: string;
        type: 'circle';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface HeatmapLayerSpecification {
        id: string;
        type: 'heatmap';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface FillExtrusionLayerSpecification {
        id: string;
        type: 'fill-extrusion';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface RasterLayerSpecification {
        id: string;
        type: 'raster';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface HillshadeLayerSpecification {
        id: string;
        type: 'hillshade';
        source: string;
        'source-layer'?: string;
        minzoom?: number;
        maxzoom?: number;
        filter?: unknown;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }

    export interface BackgroundLayerSpecification {
        id: string;
        type: 'background';
        minzoom?: number;
        maxzoom?: number;
        layout?: Record<string, unknown>;
        paint?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }
}
