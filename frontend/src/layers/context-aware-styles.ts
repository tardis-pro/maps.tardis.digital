/**
 * Context-Aware Map Styling System
 *
 * Implements dynamic map styling that adapts based on:
 * - Zoom level (macro-trends at low zoom, micro-details at high zoom)
 * - Data density (clustering visualization)
 * - Time of day (optional)
 * - User preferences
 *
 * This module provides:
 * - Zoom-dependent style functions
 * - Progressive detail rendering
 * - Smooth transitions between zoom levels
 * - Layer visibility management
 */

// Zoom level thresholds for different detail levels
export const ZOOM_THRESHOLDS = {
    // Show only major features
    CONTINENT: 3,
    // Show countries and major cities
    COUNTRY: 5,
    // Show states/regions and major roads
    REGION: 7,
    // Show cities and highways
    CITY: 9,
    // Show neighborhoods and major streets
    NEIGHBORHOOD: 11,
    // Show buildings and local streets
    STREET: 13,
    // Show building details and landmarks
    BUILDING: 15,
    // Maximum detail level
    MAX: 18,
} as const;

// Data density thresholds
export const DENSITY_THRESHOLDS = {
    LOW: 100, // Sparse data - show all features
    MEDIUM: 1000, // Moderate density - aggregate features
    HIGH: 10000, // Dense data - clustering required
    VERY_HIGH: 100000, // Very dense - server-side rendering
} as const;

// Style transition duration in milliseconds
export const TRANSITION_DURATION = 300;

// Feature size thresholds for progressive rendering
export const SIZE_THRESHOLDS = {
    LARGE: 10000, // Always show
    MEDIUM: 1000, // Show at medium zoom
    SMALL: 100, // Show at high zoom
    TINY: 10, // Show at very high zoom
} as const;

// Viewport configuration for different contexts
export interface ViewportConfig {
    minZoom: number;
    maxZoom: number;
    targetZoom: number;
    showLabels: boolean;
    showBuildings: boolean;
    showRoads: boolean;
    showPoints: boolean;
    clusterPoints: boolean;
    renderMode: 'vector' | 'raster' | 'hybrid';
}

export interface LayerStyleConfig {
    id: string;
    visible: boolean;
    opacity: number;
    minZoom: number;
    maxZoom: number;
    style: Record<string, any>;
}

export interface ZoomLevelConfig {
    zoom: number;
    label: string;
    features: string[];
    densityMode: 'show_all' | 'cluster' | 'aggregate' | 'server_render';
    recommendedViewport: Partial<ViewportConfig>;
}

/**
 * Get the zoom level configuration for a given zoom
 */
export function getZoomConfig(zoom: number): ZoomLevelConfig {
    if (zoom < ZOOM_THRESHOLDS.CONTINENT) {
        return {
            zoom,
            label: 'continent',
            features: ['countries', 'major oceans', 'continental labels'],
            densityMode: 'show_all',
            recommendedViewport: {
                showLabels: true,
                showBuildings: false,
                showRoads: false,
                showPoints: false,
                clusterPoints: false,
                renderMode: 'vector',
            },
        };
    }

    if (zoom < ZOOM_THRESHOLDS.COUNTRY) {
        return {
            zoom,
            label: 'country',
            features: ['countries', 'states', 'major cities', 'major highways'],
            densityMode: 'show_all',
            recommendedViewport: {
                showLabels: true,
                showBuildings: false,
                showRoads: true,
                showPoints: true,
                clusterPoints: false,
                renderMode: 'vector',
            },
        };
    }

    if (zoom < ZOOM_THRESHOLDS.REGION) {
        return {
            zoom,
            label: 'region',
            features: ['states', 'cities', 'major roads', 'major water bodies'],
            densityMode: 'show_all',
            recommendedViewport: {
                showLabels: true,
                showBuildings: false,
                showRoads: true,
                showPoints: true,
                clusterPoints: false,
                renderMode: 'vector',
            },
        };
    }

    if (zoom < ZOOM_THRESHOLDS.CITY) {
        return {
            zoom,
            label: 'city',
            features: ['city boundaries', 'neighborhoods', 'arterial roads'],
            densityMode: 'show_all',
            recommendedViewport: {
                showLabels: true,
                showBuildings: true,
                showRoads: true,
                showPoints: true,
                clusterPoints: false,
                renderMode: 'vector',
            },
        };
    }

    if (zoom < ZOOM_THRESHOLDS.NEIGHBORHOOD) {
        return {
            zoom,
            label: 'neighborhood',
            features: ['neighborhoods', 'local roads', 'parks', 'landmarks'],
            densityMode: 'cluster',
            recommendedViewport: {
                showLabels: true,
                showBuildings: true,
                showRoads: true,
                showPoints: true,
                clusterPoints: true,
                renderMode: 'vector',
            },
        };
    }

    if (zoom < ZOOM_THRESHOLDS.STREET) {
        return {
            zoom,
            label: 'street',
            features: ['streets', 'buildings', 'addresses', 'small parks'],
            densityMode: 'cluster',
            recommendedViewport: {
                showLabels: true,
                showBuildings: true,
                showRoads: true,
                showPoints: true,
                clusterPoints: true,
                renderMode: 'vector',
            },
        };
    }

    if (zoom < ZOOM_THRESHOLDS.BUILDING) {
        return {
            zoom,
            label: 'building',
            features: ['detailed buildings', 'street furniture', 'footpaths'],
            densityMode: 'aggregate',
            recommendedViewport: {
                showLabels: true,
                showBuildings: true,
                showRoads: true,
                showPoints: true,
                clusterPoints: false,
                renderMode: 'vector',
            },
        };
    }

    return {
        zoom,
        label: 'maximum',
        features: ['building details', 'entrances', 'landmarks'],
        densityMode: 'server_render',
        recommendedViewport: {
            showLabels: true,
            showBuildings: true,
            showRoads: true,
            showPoints: true,
            clusterPoints: false,
            renderMode: 'hybrid',
        },
    };
}

/**
 * Get optimal rendering mode based on data density and zoom level
 */
export function getOptimalRenderMode(
    zoom: number,
    featureCount: number
): 'vector' | 'raster' | 'hybrid' {
    // Very high density - use server-side raster rendering
    if (featureCount > DENSITY_THRESHOLDS.VERY_HIGH) {
        return 'raster';
    }

    // High density at medium zoom - use hybrid
    if (featureCount > DENSITY_THRESHOLDS.HIGH && zoom < ZOOM_THRESHOLDS.CITY) {
        return 'hybrid';
    }

    // High density at high zoom - aggregate or cluster
    if (featureCount > DENSITY_THRESHOLDS.HIGH) {
        return 'hybrid';
    }

    // Medium density - vector is fine
    if (featureCount > DENSITY_THRESHOLDS.MEDIUM) {
        return 'vector';
    }

    // Low density - vector with full detail
    return 'vector';
}

/**
 * Get point clustering configuration based on zoom level
 */
export function getClusterConfig(zoom: number): {
    enabled: boolean;
    radius: number;
    maxZoom: number;
    minPoints: number;
} {
    if (zoom < ZOOM_THRESHOLDS.NEIGHBORHOOD) {
        return {
            enabled: false,
            radius: 50,
            maxZoom: ZOOM_THRESHOLDS.NEIGHBORHOOD - 1,
            minPoints: 2,
        };
    }

    if (zoom < ZOOM_THRESHOLDS.STREET) {
        return {
            enabled: true,
            radius: 40,
            maxZoom: ZOOM_THRESHOLDS.STREET - 1,
            minPoints: 3,
        };
    }

    if (zoom < ZOOM_THRESHOLDS.BUILDING) {
        return {
            enabled: true,
            radius: 30,
            maxZoom: ZOOM_THRESHOLDS.BUILDING - 1,
            minPoints: 5,
        };
    }

    return {
        enabled: true,
        radius: 20,
        maxZoom: zoom,
        minPoints: 10,
    };
}

/**
 * Get style transition configuration for smooth zoom changes
 */
export function getTransitionConfig(zoom: number): {
    duration: number;
    easing: string;
    delay: number;
} {
    // Longer transitions at zoom boundaries
    if (isZoomBoundary(zoom)) {
        return {
            duration: TRANSITION_DURATION * 1.5,
            easing: 'ease-in-out',
            delay: 50,
        };
    }

    return {
        duration: TRANSITION_DURATION,
        easing: 'linear',
        delay: 0,
    };
}

/**
 * Check if zoom level is at a transition boundary
 */
function isZoomBoundary(zoom: number): boolean {
    return Object.values(ZOOM_THRESHOLDS).includes(Math.round(zoom));
}

/**
 * Get progressive road label configuration
 */
export function getRoadLabelConfig(zoom: number): {
    showLabels: boolean;
    minRoadCategory: number;
    fontSize: number;
    haloWidth: number;
} {
    if (zoom < ZOOM_THRESHOLDS.REGION) {
        return {
            showLabels: false,
            minRoadCategory: 1,
            fontSize: 10,
            haloWidth: 2,
        };
    }

    if (zoom < ZOOM_THRESHOLDS.CITY) {
        return {
            showLabels: true,
            minRoadCategory: 2,
            fontSize: 11,
            haloWidth: 2,
        };
    }

    if (zoom < ZOOM_THRESHOLDS.NEIGHBORHOOD) {
        return {
            showLabels: true,
            minRoadCategory: 3,
            fontSize: 12,
            haloWidth: 1.5,
        };
    }

    return {
        showLabels: true,
        minRoadCategory: 4,
        fontSize: 12,
        haloWidth: 1,
    };
}

/**
 * Get progressive building rendering configuration
 */
export function getBuildingConfig(zoom: number): {
    show3D: boolean;
    minHeight: number;
    extrusionScale: number;
    shadowEnabled: boolean;
} {
    if (zoom < ZOOM_THRESHOLDS.CITY) {
        return {
            show3D: false,
            minHeight: Infinity,
            extrusionScale: 0,
            shadowEnabled: false,
        };
    }

    if (zoom < ZOOM_THRESHOLDS.NEIGHBORHOOD) {
        return {
            show3D: true,
            minHeight: 50,
            extrusionScale: 0.5,
            shadowEnabled: false,
        };
    }

    if (zoom < ZOOM_THRESHOLDS.BUILDING) {
        return {
            show3D: true,
            minHeight: 20,
            extrusionScale: 0.8,
            shadowEnabled: true,
        };
    }

    return {
        show3D: true,
        minHeight: 5,
        extrusionScale: 1,
        shadowEnabled: true,
    };
}

/**
 * Context-aware layer visibility manager
 */
export class ContextAwareLayerManager {
    private layers: Map<string, LayerStyleConfig> = new Map();
    private currentZoom: number = 10;
    private currentDensity: number = 1000;

    setZoom(zoom: number): void {
        this.currentZoom = zoom;
        this.updateAllLayers();
    }

    setDataDensity(count: number): void {
        this.currentDensity = count;
        this.updateAllLayers();
    }

    registerLayer(config: LayerStyleConfig): void {
        this.layers.set(config.id, config);
        this.updateLayer(config.id);
    }

    unregisterLayer(id: string): void {
        this.layers.delete(id);
    }

    getLayerStyle(id: string): LayerStyleConfig | undefined {
        return this.layers.get(id);
    }

    getAllLayerStyles(): LayerStyleConfig[] {
        return Array.from(this.layers.values());
    }

    private updateLayer(id: string): void {
        const layer = this.layers.get(id);
        if (!layer) return;

        const zoomConfig = getZoomConfig(this.currentZoom);
        const renderMode = getOptimalRenderMode(
            this.currentZoom,
            this.currentDensity
        );

        // Update visibility based on zoom level
        const isVisible =
            layer.visible &&
            this.currentZoom >= layer.minZoom &&
            this.currentZoom <= layer.maxZoom;

        // Update opacity based on density
        let opacity = layer.opacity;
        if (this.currentDensity > DENSITY_THRESHOLDS.VERY_HIGH) {
            opacity *= 0.5; // Reduce opacity for very dense data
        }

        // Store updated config
        this.layers.set(id, {
            ...layer,
            visible: isVisible,
            opacity,
        });
    }

    private updateAllLayers(): void {
        this.layers.forEach((_, id) => this.updateLayer(id));
    }

    getCurrentContext(): {
        zoom: number;
        density: number;
        config: ReturnType<typeof getZoomConfig>;
        renderMode: ReturnType<typeof getOptimalRenderMode>;
    } {
        return {
            zoom: this.currentZoom,
            density: this.currentDensity,
            config: getZoomConfig(this.currentZoom),
            renderMode: getOptimalRenderMode(
                this.currentZoom,
                this.currentDensity
            ),
        };
    }
}

// Export singleton instance
export const layerManager = new ContextAwareLayerManager();

/**
 * Hook for using context-aware styling in React components
 */
export function useContextAwareStyling(featureCount: number): {
    zoom: number;
    config: ReturnType<typeof getZoomConfig>;
    renderMode: ReturnType<typeof getOptimalRenderMode>;
    clusterConfig: ReturnType<typeof getClusterConfig>;
    buildingConfig: ReturnType<typeof getBuildingConfig>;
    roadLabelConfig: ReturnType<typeof getRoadLabelConfig>;
} {
    // These would typically come from map state
    const zoom = 12; // This should be from map viewState

    return {
        zoom,
        config: getZoomConfig(zoom),
        renderMode: getOptimalRenderMode(zoom, featureCount),
        clusterConfig: getClusterConfig(zoom),
        buildingConfig: getBuildingConfig(zoom),
        roadLabelConfig: getRoadLabelConfig(zoom),
    };
}

/**
 * Style function for heatmap that adapts to density
 */
export function getAdaptiveHeatmapStyle(zoom: number): Record<string, any> {
    const config = getZoomConfig(zoom);

    if (config.densityMode === 'server_render') {
        return {
            visible: false, // Hide heatmap, show raster instead
        };
    }

    return {
        visible: true,
        radius: zoom < ZOOM_THRESHOLDS.CITY ? 30 : 20,
        intensity: 0.8,
        threshold: 0.3,
        // Smooth transitions
        transition: {
            duration: TRANSITION_DURATION,
            easing: 'ease-out',
        },
    };
}

/**
 * Style function for vector polygons that adapts to zoom
 */
export function getAdaptivePolygonStyle(zoom: number): Record<string, any> {
    const buildingConfig = getBuildingConfig(zoom);

    if (!buildingConfig.show3D) {
        return {
            fill: true,
            stroke: true,
            fillOpacity: 0.6,
            strokeWidth: 1,
        };
    }

    return {
        fill: true,
        stroke: true,
        fillOpacity: 0.8,
        strokeWidth: 1,
        // 3D extrusion for buildings
        extruded: buildingConfig.show3D,
        getElevation: (d: any) => {
            const height = d.properties?.height || d.height || 10;
            return height * buildingConfig.extrusionScale;
        },
        // Lighting for depth perception
        material: {
            ambient: 0.5,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [60, 64, 70],
        },
    };
}

/**
 * Style function for vector lines (roads, borders) that adapts to zoom
 */
export function getAdaptiveLineStyle(zoom: number): Record<string, any> {
    const roadConfig = getRoadLabelConfig(zoom);

    return {
        width: Math.max(1, (zoom - ZOOM_THRESHOLDS.REGION) / 2),
        opacity: zoom < ZOOM_THRESHOLDS.REGION ? 0.6 : 0.9,
        // Smooth width transition
        widthTransition: {
            duration: TRANSITION_DURATION,
            easing: 'linear',
        },
    };
}

/**
 * Style function for point data (markers, POI) that adapts to zoom
 */
export function getAdaptivePointStyle(zoom: number): Record<string, any> {
    const clusterConfig = getClusterConfig(zoom);
    const zoomConfig = getZoomConfig(zoom);

    if (zoomConfig.densityMode === 'cluster' || clusterConfig.enabled) {
        return {
            clustered: true,
            clusterRadius: clusterConfig.radius,
            clusterMinPoints: clusterConfig.minPoints,
            // Cluster styling
            pointRadius: 10,
            clusterFillColor: [255, 140, 0],
            clusterTextColor: [255, 255, 255],
            clusterTextSize: 12,
        };
    }

    return {
        clustered: false,
        pointRadius: 5,
        pointColor: [0, 122, 255],
    };
}
