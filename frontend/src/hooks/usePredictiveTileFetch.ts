/**
 * Predictive Tile Fetching Hook
 *
 * Implements mouse velocity tracking to pre-fetch map tiles in the direction
 * of movement, reducing perceived latency during panning.
 *
 * How it works:
 * 1. Track mouse/touch movement velocity during drag/pan interactions
 * 2. Calculate projected viewport bounds based on velocity
 * 3. Trigger tile prefetching for predicted bounds
 */

import React, { useCallback, useEffect, useState } from 'react';
import type {
    Map,
    MapMouseEvent,
    MapTouchEvent,
    PointLike,
    RasterSourceSpecification,
    SourceSpecification,
    StyleSpecification,
    VectorSourceSpecification,
} from 'maplibre-gl';

interface VelocityData {
    vx: number; // Velocity X (pixels per ms)
    vy: number; // Velocity Y (pixels per ms)
    timestamp: number;
}

interface PredictionConfig {
    /** Time window in ms to calculate velocity */
    velocityWindowMs: number;
    /** Prediction horizon in ms (how far ahead to fetch) */
    predictionHorizonMs: number;
    /** Minimum velocity threshold to trigger prefetch */
    minVelocity: number;
    /** Debounce delay in ms after movement stops */
    debounceMs: number;
    /** Number of extra tiles to prefetch in each direction */
    tilePadding: number;
}

interface TileCoord {
    x: number;
    y: number;
    z: number;
}

interface BoundingBox {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
}

const DEFAULT_CONFIG: PredictionConfig = {
    velocityWindowMs: 200,
    predictionHorizonMs: 500,
    minVelocity: 0.5,
    debounceMs: 100,
    tilePadding: 1,
};

export function usePredictiveTileFetch(
    map: Map | null,
    config: Partial<PredictionConfig> = {}
) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    const velocityHistory = React.useRef<VelocityData[]>([]);
    const lastMovementTime = React.useRef<number>(0);
    const isMoving = React.useRef<boolean>(false);
    const prefetchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const prefetchInProgress = React.useRef<boolean>(false);

    const [isPredicting, setIsPredicting] = useState(false);

    /**
     * Calculate velocity from recent movement history
     */
    const calculateVelocity = useCallback((): VelocityData | null => {
        const now = Date.now();
        const windowStart = now - mergedConfig.velocityWindowMs;

        // Filter to only recent movements
        const recentMovements = velocityHistory.current.filter(
            (v) => v.timestamp > windowStart
        );

        if (recentMovements.length < 2) {
            return null;
        }

        // Calculate average velocity
        let totalVx = 0;
        let totalVy = 0;
        let totalTime = 0;

        for (let i = 1; i < recentMovements.length; i++) {
            const dt =
                recentMovements[i].timestamp - recentMovements[i - 1].timestamp;
            if (dt > 0) {
                totalVx +=
                    (recentMovements[i].vx + recentMovements[i - 1].vx) / 2;
                totalVy +=
                    (recentMovements[i].vy + recentMovements[i - 1].vy) / 2;
                totalTime += dt;
            }
        }

        if (totalTime === 0 || recentMovements.length === 0) {
            return null;
        }

        return {
            vx: totalVx / (recentMovements.length - 1),
            vy: totalVy / (recentMovements.length - 1),
            timestamp: now,
        };
    }, [mergedConfig.velocityWindowMs]);

    /**
     * Convert velocity to geographic displacement
     */
    const velocityToDisplacement = useCallback(
        (
            velocity: VelocityData,
            durationMs: number,
            map: Map
        ): { dx: number; dy: number } => {
            const pixelsX = velocity.vx * durationMs;
            const pixelsY = velocity.vy * durationMs;

            const currentCenter = map.getCenter();
            const currentPoint = map.project(currentCenter);
            const newPoint: PointLike = [
                currentPoint.x + pixelsX,
                currentPoint.y + pixelsY,
            ];
            const newCenter = map.unproject(newPoint);

            return {
                dx: newCenter.lng - currentCenter.lng,
                dy: newCenter.lat - currentCenter.lat,
            };
        },
        []
    );

    /**
     * Get current viewport bounds
     */
    const getViewportBounds = useCallback((): BoundingBox | null => {
        if (!map) return null;

        const bounds = map.getBounds();
        return {
            minLon: bounds.getWest(),
            minLat: bounds.getSouth(),
            maxLon: bounds.getEast(),
            maxLat: bounds.getNorth(),
        };
    }, [map]);

    /**
     * Convert geographic bounds to tile coordinates
     */
    const boundsToTiles = useCallback(
        (bounds: BoundingBox, zoom: number): TileCoord[] => {
            const tiles: TileCoord[] = [];

            // Calculate tile range
            const minTileX = Math.floor(lonToTileX(bounds.minLon, zoom));
            const maxTileX = Math.floor(lonToTileX(bounds.maxLon, zoom));
            const minTileY = Math.floor(latToTileY(bounds.minLat, zoom));
            const maxTileY = Math.floor(latToTileY(bounds.maxLat, zoom));

            for (
                let x = minTileX - mergedConfig.tilePadding;
                x <= maxTileX + mergedConfig.tilePadding;
                x++
            ) {
                for (
                    let y = minTileY - mergedConfig.tilePadding;
                    y <= maxTileY + mergedConfig.tilePadding;
                    y++
                ) {
                    tiles.push({ x, y, z: zoom });
                }
            }

            return tiles;
        },
        [mergedConfig.tilePadding]
    );

    /**
     * Calculate predicted bounds based on velocity
     */
    const getPredictedBounds = useCallback((): BoundingBox | null => {
        const velocity = calculateVelocity();
        if (!velocity || !map) return null;

        const displacement = velocityToDisplacement(
            velocity,
            mergedConfig.predictionHorizonMs,
            map
        );
        const currentBounds = getViewportBounds();
        if (!currentBounds) return null;

        return {
            minLon: currentBounds.minLon + displacement.dx,
            maxLon: currentBounds.maxLon + displacement.dx,
            minLat: currentBounds.minLat + displacement.dy,
            maxLat: currentBounds.maxLat + displacement.dy,
        };
    }, [
        calculateVelocity,
        velocityToDisplacement,
        mergedConfig.predictionHorizonMs,
        getViewportBounds,
        map,
    ]);

    /**
     * Prefetch tiles for predicted viewport
     */
    const prefetchTiles = useCallback(async () => {
        if (!map || prefetchInProgress.current) return;

        const predictedBounds = getPredictedBounds();
        if (!predictedBounds) return;

        const zoom = map.getZoom();
        const tiles = boundsToTiles(predictedBounds, zoom);

        const style = map.getStyle();
        tiles.forEach((tile) => {
            const urls = tileToURLs(tile, style);
            urls.forEach(preloadImage);
        });

        prefetchInProgress.current = true;
        setIsPredicting(true);

        // Reset flag after prefetch
        setTimeout(() => {
            prefetchInProgress.current = false;
            setIsPredicting(false);
        }, 50);
    }, [map, getPredictedBounds, boundsToTiles]);

    /**
     * Handle move/drag events - update velocity tracking
     */
    const handleMove = useCallback(
        (event: MapMouseEvent | MapTouchEvent) => {
            const now = Date.now();
            const timeSinceLast = now - lastMovementTime.current;

            if (timeSinceLast > mergedConfig.debounceMs) {
                velocityHistory.current = [];
            }

            const point = event.point;
            const prevVelocity =
                velocityHistory.current[velocityHistory.current.length - 1];

            if (prevVelocity) {
                const vx =
                    (point.x - prevVelocity.vx * timeSinceLast) / timeSinceLast;
                const vy =
                    (point.y - prevVelocity.vy * timeSinceLast) / timeSinceLast;

                if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
                    velocityHistory.current.push({
                        vx: point.x,
                        vy: point.y,
                        timestamp: now,
                    });

                    const windowStart = now - mergedConfig.velocityWindowMs;
                    velocityHistory.current = velocityHistory.current.filter(
                        (v) => v.timestamp > windowStart
                    );
                }
            } else {
                velocityHistory.current.push({
                    vx: point.x,
                    vy: point.y,
                    timestamp: now,
                });
            }

            lastMovementTime.current = now;
            isMoving.current = true;

            // Schedule prefetch
            if (prefetchTimer.current) {
                clearTimeout(prefetchTimer.current);
            }

            prefetchTimer.current = setTimeout(() => {
                prefetchTiles();
            }, 50); // Small delay to batch movements
        },
        [mergedConfig.debounceMs, mergedConfig.velocityWindowMs, prefetchTiles]
    );

    /**
     * Clean up timer when movement stops
     */
    const handleMoveEnd = useCallback(() => {
        isMoving.current = false;

        if (prefetchTimer.current) {
            clearTimeout(prefetchTimer.current);
            prefetchTimer.current = null;
        }

        // Clear velocity history after a delay
        setTimeout(() => {
            if (!isMoving.current) {
                velocityHistory.current = [];
            }
        }, mergedConfig.debounceMs * 2);
    }, [mergedConfig.debounceMs]);

    /**
     * Set up event listeners
     */
    useEffect(() => {
        if (!map) return;

        // Track movement events for velocity calculation
        map.on('move', handleMove);
        map.on('moveend', handleMoveEnd);

        // Also track drag events for more responsive feedback
        map.on('drag', handleMove);
        map.on('dragend', handleMoveEnd);

        return () => {
            map.off('move', handleMove);
            map.off('moveend', handleMoveEnd);
            map.off('drag', handleMove);
            map.off('dragend', handleMoveEnd);

            if (prefetchTimer.current) {
                clearTimeout(prefetchTimer.current);
            }
        };
    }, [map, handleMove, handleMoveEnd]);

    return {
        isPredicting,
        velocity: calculateVelocity(),
        config: mergedConfig,
    };
}

// Helper functions

/**
 * Convert longitude to tile X coordinate
 */
function lonToTileX(lon: number, zoom: number): number {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
}

/**
 * Convert latitude to tile Y coordinate
 */
function latToTileY(lat: number, zoom: number): number {
    const latRad = (lat * Math.PI) / 180;
    return (
        ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
    );
}

/**
 * Generate tile URL for prefetching
 */
function tileToURLs(
    tile: TileCoord,
    style: StyleSpecification | undefined
): string[] {
    if (!hasStyleSources(style)) {
        return [];
    }

    const urls: string[] = [];
    for (const source of Object.values(style.sources)) {
        if (isRasterOrVectorSource(source) && Array.isArray(source.tiles)) {
            if (source.tiles.length === 0) {
                continue;
            }

            const template = source.tiles[0];
            const url = template
                .replace('{z}', tile.z.toString())
                .replace('{x}', tile.x.toString())
                .replace('{y}', tile.y.toString());
            urls.push(url);
        }
    }

    return urls;
}

function hasStyleSources(
    style: StyleSpecification | undefined
): style is StyleSpecification & {
    sources: Record<string, SourceSpecification>;
} {
    return (
        typeof style === 'object' &&
        style !== null &&
        'sources' in style &&
        typeof style.sources === 'object' &&
        style.sources !== null
    );
}

function isRasterOrVectorSource(
    source: SourceSpecification
): source is RasterSourceSpecification | VectorSourceSpecification {
    return source.type === 'raster' || source.type === 'vector';
}

/**
 * Preload image for tile prefetching
 */
function preloadImage(url: string): void {
    const img = new Image();
    img.src = url;
}

/**
 * Hook for automatic predictive prefetching
 * Use this instead of usePredictiveTileFetch for simpler usage
 */
export function useAutoPredictiveFetch(
    map: Map | null,
    options: {
        enabled?: boolean;
        onPrefetch?: (tiles: TileCoord[]) => void;
    } = {}
) {
    const { enabled = true, onPrefetch } = options;

    const { isPredicting, velocity, config } = usePredictiveTileFetch(map);

    useEffect(() => {
        if (!enabled || !map || !velocity) return;

        // Only prefetch if velocity is above threshold
        const speed = Math.sqrt(
            velocity.vx * velocity.vx + velocity.vy * velocity.vy
        );
        if (speed < config.minVelocity) return;

        // Get predicted bounds and convert to tiles
        // Calculate predicted viewport based on velocity
        const displacementX = velocity.vx * config.predictionHorizonMs;
        const displacementY = velocity.vy * config.predictionHorizonMs;

        const bounds = map.getBounds();
        const projectedCenter = map.project(bounds.getCenter());
        const predictedPoint: PointLike = [
            projectedCenter.x + displacementX,
            projectedCenter.y + displacementY,
        ];
        const predictedCenter = map.unproject(predictedPoint);

        const lngSpan = bounds.getEast() - bounds.getWest();
        const latSpan = bounds.getNorth() - bounds.getSouth();

        const predictedBounds: BoundingBox = {
            minLon: predictedCenter.lng - lngSpan / 2,
            maxLon: predictedCenter.lng + lngSpan / 2,
            minLat: predictedCenter.lat - latSpan / 2,
            maxLat: predictedCenter.lat + latSpan / 2,
        };

        const zoom = Math.floor(map.getZoom());
        const tiles: TileCoord[] = [];

        const minTileX = Math.floor(lonToTileX(predictedBounds.minLon, zoom));
        const maxTileX = Math.floor(lonToTileX(predictedBounds.maxLon, zoom));
        const minTileY = Math.floor(latToTileY(predictedBounds.maxLat, zoom));
        const maxTileY = Math.floor(latToTileY(predictedBounds.minLat, zoom));

        for (
            let x = minTileX - config.tilePadding;
            x <= maxTileX + config.tilePadding;
            x++
        ) {
            for (
                let y = minTileY - config.tilePadding;
                y <= maxTileY + config.tilePadding;
                y++
            ) {
                tiles.push({ x, y, z: zoom });
            }
        }

        // Notify about tiles to prefetch
        if (onPrefetch) {
            onPrefetch(tiles);
        }
    }, [velocity, enabled, config, map, onPrefetch]);

    return {
        isPredicting,
        speed: velocity ? Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2) : 0,
    };
}
