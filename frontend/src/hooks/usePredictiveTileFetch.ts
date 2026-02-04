/**
 * Predictive Tile Fetching Hook
 *
 * Implements mouse velocity tracking to pre-fetch map tiles in the direction
 * of user movement, reducing perceived latency during panning.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapRef, ViewState } from 'react-map-gl';

// Velocity vector type
export interface Velocity {
  vx: number; // horizontal velocity (pixels/frame)
  vy: number; // vertical velocity (pixels/frame)
}

// Viewport bounds type
export interface ViewportBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
  width: number;
  height: number;
}

// Prefetch configuration
export interface PrefetchConfig {
  /** Number of seconds to predict ahead */
  predictionWindow: number;
  /** Minimum velocity to trigger prefetch (pixels/frame) */
  velocityThreshold: number;
  /** Maximum tiles to prefetch per update */
  maxTiles: number;
  /** Zoom levels to prefetch (relative to current) */
  zoomLevels: number[];
  /** Debounce delay in ms */
  debounceMs: number;
}

// Default configuration
const DEFAULT_CONFIG: PrefetchConfig = {
  predictionWindow: 2, // 2 seconds ahead
  velocityThreshold: 5, // 5 pixels/frame
  maxTiles: 20,
  zoomLevels: [0, 1], // Current + 1 level
  debounceMs: 100,
};

/**
 * Calculate current viewport bounds
 */
function getViewportBounds(
  longitude: number,
  latitude: number,
  zoom: number,
  width: number,
  height: number
): ViewportBounds {
  const latDelta = (360 / (2 ** (zoom + 8))) * (height / 256);
  const lonDelta = (360 / (2 ** (zoom + 8))) * (width / 256);

  return {
    minLon: longitude - lonDelta / 2,
    maxLon: longitude + lonDelta / 2,
    minLat: latitude - latDelta / 2,
    maxLat: latitude + latDelta / 2,
    width,
    height,
  };
}

/**
 * Calculate future viewport bounds based on velocity
 */
function predictViewportBounds(
  currentBounds: ViewportBounds,
  velocity: Velocity,
  predictionWindow: number,
  width: number,
  height: number,
  zoom: number
): ViewportBounds {
  // Convert velocity to degrees
  const metersPerPixel = 40075000 / (256 * 2 ** zoom);
  const metersPerDegree = 111000;

  const dx = (velocity.vx * predictionWindow * metersPerPixel) / metersPerDegree;
  const dy = (velocity.vy * predictionWindow * metersPerPixel) / metersPerDegree;

  return {
    minLon: currentBounds.minLon - dx,
    maxLon: currentBounds.maxLon - dx,
    minLat: Math.max(-85, currentBounds.minLat - dy),
    maxLat: Math.min(85, currentBounds.maxLat - dy),
    width,
    height,
  };
}

/**
 * Get tile coordinates for a viewport
 */
function getTilesForBounds(
  bounds: ViewportBounds,
  zoom: number
): { x: number; y: number; z: number }[] {
  const tiles: { x: number; y: number; z: number }[] = [];

  for (let z = zoom; z <= zoom; z++) {
    const n = 2 ** z;
    const minX = Math.floor((bounds.minLon + 180) / 360 * n);
    const maxX = Math.floor((bounds.maxLon + 180) / 360 * n);
    const minY = Math.floor((1 - Math.log(Math.tan((bounds.minLat * Math.PI) / 180) + 1 / Math.cos((bounds.minLat * Math.PI) / 180)) / Math.PI) / 2 * n);
    const maxY = Math.floor((1 - Math.log(Math.tan((bounds.maxLat * Math.PI) / 180) + 1 / Math.cos((bounds.maxLat * Math.PI) / 180)) / Math.PI) / 2 * n);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ x, y, z });
      }
    }
  }

  return tiles;
}

/**
 * Calculate tile URLs for prefetching
 */
function generateTileUrls(
  tiles: { x: number; y: number; z: number }[],
  tileServer: string
): string[] {
  return tiles.map((tile) =>
    tileServer
      .replace('{z}', tile.z.toString())
      .replace('{x}', tile.x.toString())
      .replace('{y}', tile.y.toString())
  );
}

/**
 * Prefetch tiles by creating invisible image elements
 */
async function prefetchTiles(urls: string[], maxConcurrent = 5): Promise<void> {
  const chunks: string[][] = [];

  for (let i = 0; i < urls.length; i += maxConcurrent) {
    chunks.push(urls.slice(i, i + maxConcurrent));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't fail on error
            img.src = url;
          })
      )
    );
  }
}

/**
 * Hook for predictive tile fetching
 */
export function usePredictiveTileFetch(
  mapRef: React.RefObject<MapRef>,
  tileServer: string,
  onPrefetch?: (urls: string[]) => void,
  config: Partial<PrefetchConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const velocityRef = useRef<Velocity>({ vx: 0, vy: 0 });
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const prefetchQueueRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<number | null>(null);

  // Smooth velocity using exponential moving average
  const smoothVelocity = useCallback((newVx: number, newVy: number) => {
    const alpha = 0.3; // Smoothing factor
    velocityRef.current.vx = velocityRef.current.vx * (1 - alpha) + newVx * alpha;
    velocityRef.current.vy = velocityRef.current.vy * (1 - alpha) + newVy * alpha;
  }, []);

  // Calculate and trigger prefetch
  const triggerPrefetch = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !tileServer) return;

    const viewState = map.getViewState() as ViewState;
    if (!viewState || viewState.width === 0 || viewState.height === 0) return;

    const velocity = velocityRef.current;
    const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);

    // Skip if below threshold
    if (speed < fullConfig.velocityThreshold) return;

    // Calculate current and predicted bounds
    const currentBounds = getViewportBounds(
      viewState.longitude,
      viewState.latitude,
      viewState.zoom,
      viewState.width,
      viewState.height
    );

    const predictedBounds = predictViewportBounds(
      currentBounds,
      velocity,
      fullConfig.predictionWindow,
      viewState.width,
      viewState.height,
      viewState.zoom
    );

    // Get tiles for predicted bounds
    let tiles = getTilesForBounds(predictedBounds, viewState.zoom);

    // Limit tiles
    if (tiles.length > fullConfig.maxTiles) {
      tiles = tiles.slice(0, fullConfig.maxTiles);
    }

    // Generate URLs
    const urls = generateTileUrls(tiles, tileServer);

    // Filter already prefetched
    const newUrls = urls.filter((url) => !prefetchQueueRef.current.has(url));

    if (newUrls.length === 0) return;

    // Add to queue
    newUrls.forEach((url) => prefetchQueueRef.current.add(url));

    // Trigger prefetch
    setIsPrefetching(true);
    await prefetchTiles(newUrls);
    setIsPrefetching(false);

    // Callback
    onPrefetch?.(newUrls);
  }, [mapRef, tileServer, fullConfig, onPrefetch]);

  // Mouse move handler
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    const deltaTime = now - lastUpdateRef.current;

    if (deltaTime < 16) return; // Skip if too frequent (60fps max)

    const { clientX, clientY } = event;

    if (lastMouseRef.current) {
      const dx = clientX - lastMouseRef.current.x;
      const dy = clientY - lastMouseRef.current.y;

      // Calculate velocity (pixels per frame, assuming 60fps)
      const vx = dx / (deltaTime / 16.67);
      const vy = dy / (deltaTime / 16.67);

      smoothVelocity(vx, vy);
    }

    lastMouseRef.current = { x: clientX, y: clientY };
    lastUpdateRef.current = now;

    // Debounce prefetch trigger
    if (debounceTimerRef.current) {
      cancelAnimationFrame(debounceTimerRef.current);
    }

    debounceTimerRef.current = requestAnimationFrame(() => {
      triggerPrefetch();
    });
  }, [smoothVelocity, triggerPrefetch]);

  // Animation loop for continuous velocity tracking
  const animationLoop = useCallback(() => {
    const velocity = velocityRef.current;
    const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);

    if (speed > fullConfig.velocityThreshold) {
      // Decay velocity (friction)
      velocity.vx *= 0.95;
      velocity.vy *= 0.95;

      // Trigger prefetch
      triggerPrefetch();
    }

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [fullConfig, triggerPrefetch]);

  // Start/stop tracking
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animationLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (debounceTimerRef.current) {
        cancelAnimationFrame(debounceTimerRef.current);
      }
    };
  }, [mapRef, animationLoop]);

  // Clean up prefetched tiles periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      prefetchQueueRef.current.clear();
    }, 30000); // Clear every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    handleMouseMove,
    isPrefetching,
    velocity: velocityRef.current,
    prefetchQueueSize: prefetchQueueRef.current.size,
  };
}

export default usePredictiveTileFetch;
