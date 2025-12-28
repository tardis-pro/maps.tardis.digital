declare module '@turf/turf' {
    import {
        Feature,
        FeatureCollection,
        Geometry,
        Point,
        Polygon,
        MultiPolygon,
        GeoJsonProperties,
        BBox,
        Position,
    } from 'geojson';

    export type Units =
        | 'meters'
        | 'kilometers'
        | 'miles'
        | 'degrees'
        | 'radians'
        | 'nauticalmiles';

    // Allow any GeoJSON type for turf operations
    export type AllGeoJSON = Feature | FeatureCollection | Geometry;

    export interface BufferOptions {
        units?: Units;
        steps?: number;
    }

    export function buffer<G extends Geometry>(
        geojson: Feature<G> | G,
        radius: number,
        options?: BufferOptions
    ): Feature<Polygon | MultiPolygon>;

    export function featureCollection<G extends Geometry = Geometry>(
        features: Feature<G>[]
    ): FeatureCollection<G>;

    export function feature<G extends Geometry = Geometry>(
        geometry: G,
        properties?: GeoJsonProperties,
        options?: { bbox?: BBox; id?: string | number }
    ): Feature<G>;

    export function point(
        coordinates: Position,
        properties?: GeoJsonProperties,
        options?: { bbox?: BBox; id?: string | number }
    ): Feature<Point>;

    export function intersect(
        feature1: AllGeoJSON,
        feature2: AllGeoJSON
    ): Feature<Polygon | MultiPolygon> | null;

    export function union(
        feature1: AllGeoJSON,
        feature2: AllGeoJSON
    ): Feature<Polygon | MultiPolygon> | null;

    export function difference(
        feature1: AllGeoJSON,
        feature2: AllGeoJSON
    ): Feature<Polygon | MultiPolygon> | null;

    export function booleanPointInPolygon(
        point: AllGeoJSON,
        polygon: AllGeoJSON
    ): boolean;

    export function clustersDbscan(
        points: FeatureCollection,
        maxDistance: number,
        options?: { units?: Units; minPoints?: number; mutate?: boolean }
    ): FeatureCollection;

    export function bbox(geojson: AllGeoJSON): BBox;

    export function pointGrid(
        bbox: BBox,
        cellSide: number,
        options?: {
            units?: Units;
            mask?: Feature<Polygon | MultiPolygon>;
            properties?: GeoJsonProperties;
        }
    ): FeatureCollection<Point>;

    export function distance(
        from: Feature<Point> | Position | AllGeoJSON,
        to: Feature<Point> | Position | AllGeoJSON,
        options?: { units?: Units }
    ): number;

    export function area(geojson: AllGeoJSON): number;

    export function centroid(
        geojson: AllGeoJSON,
        options?: { properties?: GeoJsonProperties }
    ): Feature<Point>;

    // Re-export helpers
    export * from '@turf/helpers';
}

declare module '@turf/helpers' {
    import {
        Feature,
        FeatureCollection,
        Geometry,
        Point,
        Polygon,
        MultiPolygon,
        GeoJsonProperties,
        BBox,
        Position,
    } from 'geojson';

    export type Units =
        | 'meters'
        | 'kilometers'
        | 'miles'
        | 'degrees'
        | 'radians'
        | 'nauticalmiles';

    export function featureCollection<G extends Geometry = Geometry>(
        features: Feature<G>[]
    ): FeatureCollection<G>;

    export function feature<G extends Geometry = Geometry>(
        geometry: G,
        properties?: GeoJsonProperties,
        options?: { bbox?: BBox; id?: string | number }
    ): Feature<G>;

    export function point(
        coordinates: Position,
        properties?: GeoJsonProperties,
        options?: { bbox?: BBox; id?: string | number }
    ): Feature<Point>;
}
