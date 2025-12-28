import * as turf from '@turf/turf';
import { FeatureCollection, Feature, Point } from 'geojson';

type Units =
    | 'meters'
    | 'kilometers'
    | 'miles'
    | 'degrees'
    | 'radians'
    | 'nauticalmiles';

interface FeatureWithCoordinates {
    geometry: {
        type: string;
        coordinates: number[] | number[][] | number[][][] | number[][][][];
    };
    properties?: Record<string, unknown>;
}

/**
 * Utility class for spatial analysis operations
 */
export class SpatialAnalysis {
    /**
     * Create a buffer around a GeoJSON feature or feature collection
     * @param geojson The GeoJSON to buffer
     * @param radius The buffer radius in kilometers
     * @returns A feature collection with the buffered geometries
     */
    static buffer(
        geojson: FeatureCollection | Feature,
        radius: number
    ): FeatureCollection {
        try {
            const options = { units: 'kilometers' as Units };

            if ('features' in geojson) {
                // Handle FeatureCollection
                const features = geojson.features.map((feature: Feature) =>
                    turf.buffer(feature, radius, options)
                );
                return turf.featureCollection(features);
            } else {
                // Handle single feature
                const buffered = turf.buffer(geojson, radius, options);
                return turf.featureCollection([buffered]);
            }
        } catch (error) {
            console.error('Error creating buffer:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Perform a spatial intersection between two GeoJSON feature collections
     * @param fc1 The first feature collection
     * @param fc2 The second feature collection
     * @returns A feature collection with the intersected geometries
     */
    static intersection(
        fc1: FeatureCollection,
        fc2: FeatureCollection
    ): FeatureCollection {
        try {
            const results: Feature[] = [];

            // For each feature in the first collection
            fc1.features.forEach((feature1: Feature) => {
                // For each feature in the second collection
                fc2.features.forEach((feature2: Feature) => {
                    try {
                        const intersection = turf.intersect(
                            feature1 as turf.AllGeoJSON,
                            feature2 as turf.AllGeoJSON
                        );

                        if (intersection) {
                            // Combine properties from both features
                            const properties = {
                                ...feature1.properties,
                                ...feature2.properties,
                                _source1Id: feature1.id,
                                _source2Id: feature2.id,
                            };

                            // Create a feature with the intersection geometry and combined properties
                            const feature = turf.feature(
                                intersection.geometry,
                                properties
                            );

                            results.push(feature);
                        }
                    } catch (err) {
                        // Skip invalid geometry combinations
                        console.warn('Skipping invalid intersection:', err);
                    }
                });
            });

            return turf.featureCollection(results);
        } catch (error) {
            console.error('Error performing intersection:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Perform a spatial union of a feature collection
     * @param featureCollection The feature collection to union
     * @returns A feature collection with the unioned geometry
     */
    static union(featureCollection: FeatureCollection): FeatureCollection {
        try {
            if (featureCollection.features.length === 0) {
                return turf.featureCollection([]);
            }

            let unioned: Feature = featureCollection.features[0];

            // Perform union operation sequentially
            for (let i = 1; i < featureCollection.features.length; i++) {
                try {
                    const result = turf.union(
                        unioned as turf.AllGeoJSON,
                        featureCollection.features[i] as turf.AllGeoJSON
                    );

                    if (result) {
                        unioned = result;
                    }
                } catch (err) {
                    console.warn('Skipping invalid union:', err);
                }
            }

            return turf.featureCollection([unioned]);
        } catch (error) {
            console.error('Error performing union:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Perform a spatial difference between two feature collections
     * @param fc1 The base feature collection
     * @param fc2 The feature collection to subtract
     * @returns A feature collection with the difference geometries
     */
    static difference(
        fc1: FeatureCollection,
        fc2: FeatureCollection
    ): FeatureCollection {
        try {
            const results: Feature[] = [];

            // For each feature in the first collection
            fc1.features.forEach((feature1: Feature) => {
                let currentFeature: Feature = feature1;

                // Subtract each feature from the second collection
                fc2.features.forEach((feature2: Feature) => {
                    try {
                        const diff = turf.difference(
                            currentFeature as turf.AllGeoJSON,
                            feature2 as turf.AllGeoJSON
                        );

                        if (diff) {
                            currentFeature = diff;
                        }
                    } catch (err) {
                        // Skip invalid geometry combinations
                        console.warn('Skipping invalid difference:', err);
                    }
                });

                // Add the final result to the output
                results.push(currentFeature);
            });

            return turf.featureCollection(results);
        } catch (error) {
            console.error('Error performing difference:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Perform a point in polygon analysis
     * @param points A feature collection of points
     * @param polygons A feature collection of polygons
     * @returns A feature collection of points with polygon properties joined
     */
    static pointsInPolygon(
        points: FeatureCollection,
        polygons: FeatureCollection
    ): FeatureCollection {
        try {
            const results: Feature[] = [];

            points.features.forEach((point: Feature) => {
                let pointWithData: Feature = { ...point };
                let foundMatch = false;

                // Find all polygons that contain this point
                polygons.features.forEach((polygon: Feature) => {
                    if (
                        turf.booleanPointInPolygon(
                            point as turf.AllGeoJSON,
                            polygon as turf.AllGeoJSON
                        )
                    ) {
                        // Add polygon properties to the point
                        pointWithData = {
                            ...pointWithData,
                            properties: {
                                ...pointWithData.properties,
                                ...polygon.properties,
                                _containingPolygonId: polygon.id,
                            },
                        };

                        foundMatch = true;
                    }
                });

                if (foundMatch) {
                    results.push(pointWithData);
                }
            });

            return turf.featureCollection(results);
        } catch (error) {
            console.error('Error performing point in polygon analysis:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Generate clusters from point data
     * @param points A feature collection of points
     * @param options Clustering options
     * @returns A feature collection of clustered points
     */
    static cluster(
        points: FeatureCollection,
        options: {
            radius?: number;
            property?: string;
            units?: Units;
        } = {}
    ): FeatureCollection {
        try {
            const opts = {
                radius: options.radius || 100,
                units: options.units || ('kilometers' as Units),
            };

            return turf.clustersDbscan(points, opts.radius, {
                units: opts.units,
            });
        } catch (error) {
            console.error('Error clustering points:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Generate isochrones (time-based travel distance polygons)
     * @param points Feature collection of points
     * @param options Isochrone options
     * @returns Feature collection of isochrone polygons
     */
    static isochrones(
        points: FeatureCollection,
        options: {
            minutes?: number[];
            mode?: 'driving' | 'walking' | 'cycling';
        } = {}
    ): FeatureCollection {
        // This is a placeholder - in a real app you would call a routing service API
        // such as Mapbox, OSRM, etc.

        // Simulate isochrones by creating buffers of different sizes
        try {
            const minutes = options.minutes || [5, 10, 15, 30, 60];
            const mode = options.mode || 'driving';

            // Convert minutes to approximate distances in km
            // Very rough approximation:
            // - Driving: ~0.8 km per minute
            // - Walking: ~0.08 km per minute
            // - Cycling: ~0.25 km per minute
            let speedFactor: number;
            switch (mode) {
                case 'walking':
                    speedFactor = 0.08;
                    break;
                case 'cycling':
                    speedFactor = 0.25;
                    break;
                default:
                    speedFactor = 0.8;
                    break;
            }

            const results: Feature[] = [];

            points.features.forEach((point: Feature) => {
                minutes.forEach((time: number) => {
                    const distance = time * speedFactor;
                    const buffer = turf.buffer(point, distance, {
                        units: 'kilometers' as Units,
                    });

                    buffer.properties = {
                        ...buffer.properties,
                        ...point.properties,
                        isochroneMinutes: time,
                        travelMode: mode,
                        pointId: point.id,
                    };

                    results.push(buffer);
                });
            });

            return turf.featureCollection(results);
        } catch (error) {
            console.error('Error generating isochrones:', error);
            return turf.featureCollection([]);
        }
    }

    /**
     * Calculate distance between two points
     * @param point1 First point
     * @param point2 Second point
     * @param units Units for the distance
     * @returns Distance in the specified units
     */
    static distance(
        point1: Feature,
        point2: Feature,
        units: Units = 'kilometers'
    ): number {
        try {
            return turf.distance(point1, point2, { units });
        } catch (error) {
            console.error('Error calculating distance:', error);
            return 0;
        }
    }

    /**
     * Calculate area of a polygon
     * @param polygon The polygon to measure
     * @param units Units for the area
     * @returns Area in the specified units
     */
    static area(
        polygon: Feature,
        units: 'meters' | 'kilometers' | 'hectares' = 'kilometers'
    ): number {
        try {
            const areaInSquareMeters = turf.area(polygon);

            switch (units) {
                case 'kilometers':
                    return areaInSquareMeters / 1000000;
                case 'hectares':
                    return areaInSquareMeters / 10000;
                default:
                    return areaInSquareMeters;
            }
        } catch (error) {
            console.error('Error calculating area:', error);
            return 0;
        }
    }

    /**
     * Calculate the centroid of a feature
     * @param feature The feature to find the centroid of
     * @returns A point feature representing the centroid
     */
    static centroid(feature: Feature): Feature<Point> {
        try {
            return turf.centroid(feature);
        } catch (error) {
            console.error('Error calculating centroid:', error);
            // Return a null island point as fallback
            return turf.point([0, 0]);
        }
    }

    /**
     * Find hotspots in point data using kernel density estimation
     * @param points Feature collection of points
     * @param options Hotspot analysis options
     * @returns Grid feature collection with density values
     */
    static hotspotAnalysis(
        points: FeatureCollection,
        options: {
            cellSize?: number;
            property?: string;
            units?: Units;
        } = {}
    ): FeatureCollection {
        try {
            // Convert points to a grid of density values
            const opts = {
                cellSize: options.cellSize || 5,
                property: options.property,
                units: (options.units || 'kilometers') as Units,
            };

            // Calculate the bounding box for the points
            const bbox = turf.bbox(points);

            // Create a grid of points
            const grid = turf.pointGrid(bbox, opts.cellSize, {
                units: opts.units,
            });

            // For each grid point, count nearby points
            grid.features.forEach((cell: Feature<Point>) => {
                const cellPoint = cell.geometry.coordinates;
                let count = 0;
                let sum = 0;

                points.features.forEach((point: Feature) => {
                    const pointWithCoords = point as FeatureWithCoordinates;
                    const pointCoords = pointWithCoords.geometry
                        .coordinates as number[];
                    const dist = turf.distance(cellPoint, pointCoords, {
                        units: opts.units,
                    });

                    // Points within cellSize distance influence the cell
                    if (dist <= opts.cellSize) {
                        count++;

                        // If a property is specified, use it for weighting
                        if (
                            opts.property &&
                            point.properties &&
                            point.properties[opts.property]
                        ) {
                            sum += Number(point.properties[opts.property]);
                        }
                    }
                });

                cell.properties = {
                    ...cell.properties,
                    count,
                    density: count / (Math.PI * opts.cellSize * opts.cellSize),
                    sum: opts.property ? sum : null,
                    average: opts.property && count > 0 ? sum / count : null,
                };
            });

            return grid;
        } catch (error) {
            console.error('Error performing hotspot analysis:', error);
            return turf.featureCollection([]);
        }
    }
}

export default SpatialAnalysis;
