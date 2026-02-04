/**
 * 3D Building Extrusion Layer
 *
 * Renders buildings with 3D extrusion based on height attributes.
 * Supports zoom-dependent progressive rendering for performance.
 *
 * Features:
 * - Height-based extrusion from building height or levels
 * - Progressive rendering based on zoom level
 * - Lighting effects for depth perception
 * - Configurable extrusion parameters
 */

import React, { useMemo } from 'react';
import { Layer } from 'react-map-gl/maplibre';
import { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

export interface ExtrusionConfig {
    /** Height attribute field name (default: 'height') */
    heightField: string;
    /** Base height attribute field name (default: 'base_height') */
    baseHeightField: string;
    /** Extrusion color (hex or expression) */
    color: string;
    /** Opacity (0-1) */
    opacity: number;
    /** Enable lighting for depth effect */
    enableLighting: boolean;
    /** Light intensity (0-1) */
    lightIntensity: number;
    /** Minimum zoom level for extrusion */
    minZoom: number;
    /** Maximum zoom level for extrusion */
    maxZoom: number;
    /** Transition duration for smooth zoom changes */
    transitionDuration: number;
}

export interface ExtrusionLayerProps {
    /** Source layer ID */
    sourceId: string;
    /** Source layer name in the vector tile */
    sourceLayer: string;
    /** Extrusion configuration */
    config?: Partial<ExtrusionConfig>;
    /** Whether the layer is visible */
    visible?: boolean;
    /** Before layer ID for z-index control */
    beforeId?: string;
}

const DEFAULT_CONFIG: ExtrusionConfig = {
    heightField: 'height',
    baseHeightField: 'base_height',
    color: '#d4c4a8',
    opacity: 0.9,
    enableLighting: true,
    lightIntensity: 0.5,
    minZoom: 13,
    maxZoom: 22,
    transitionDuration: 300,
};

const DEFAULT_COLOR = '#d4c4a8';

/**
 * 3D Extrusion Layer Component
 */
export const ThreeDExtrusionLayer: React.FC<ExtrusionLayerProps> = ({
    sourceId,
    sourceLayer,
    config = {},
    visible = true,
    beforeId = 'waterway-river-canal-shadow',
}) => {
    const extrusionConfig = useMemo(
        () => ({ ...DEFAULT_CONFIG, ...config }),
        [config]
    );

    const { heightField, baseHeightField, color, opacity, minZoom, maxZoom } =
        extrusionConfig;

    const layer: LayerSpecification = useMemo(
        () => ({
            id: `${sourceId}-extrusion`,
            type: 'fill-extrusion',
            source: sourceId,
            'source-layer': sourceLayer,
            minzoom: minZoom,
            maxzoom: maxZoom,
            filter: [
                'all',
                ['==', '$type', 'Polygon'],
                ['has', heightField],
                ['>', ['get', heightField], 0],
            ],
            paint: {
                // Extrusion height from data attribute
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    minZoom,
                    ['get', heightField],
                    maxZoom,
                    ['get', heightField],
                ],
                // Base height (for buildings that start above ground)
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    minZoom,
                    ['get', baseHeightField],
                    maxZoom,
                    ['get', baseHeightField],
                ],
                // Color with subtle variation
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    minZoom,
                    color,
                    maxZoom,
                    color,
                ],
                // Opacity
                'fill-extrusion-opacity': opacity,
                // Vertical gradient for depth effect
                'fill-extrusion-vertical-gradient': true,
                // Enable ambient occlusion for realistic shadows
                'fill-extrusion-vertical-gradient-ratio': 0.3,
            },
            layout: {
                visibility: visible ? 'visible' : 'none',
            },
        }),
        [
            sourceId,
            sourceLayer,
            heightField,
            baseHeightField,
            color,
            opacity,
            minZoom,
            maxZoom,
            visible,
        ]
    );

    return <Layer {...layer} beforeId={beforeId} />;
};

/**
 * 3D Extrusion with Lighting Effect
 * Adds directional lighting for better depth perception
 */
export const ThreeDExtrusionLayerWithLighting: React.FC<
    ExtrusionLayerProps
> = ({
    sourceId,
    sourceLayer,
    config = {},
    visible = true,
    beforeId = 'waterway-river-canal-shadow',
}) => {
    const extrusionConfig = useMemo(
        () => ({ ...DEFAULT_CONFIG, ...config }),
        [config]
    );

    const { heightField, baseHeightField, opacity, minZoom, maxZoom } =
        extrusionConfig;

    const layer: LayerSpecification = useMemo(
        () => ({
            id: `${sourceId}-extrusion`,
            type: 'fill-extrusion',
            source: sourceId,
            'source-layer': sourceLayer,
            minzoom: minZoom,
            maxzoom: maxZoom,
            filter: [
                'all',
                ['==', '$type', 'Polygon'],
                ['has', heightField],
                ['>', ['get', heightField], 0],
            ],
            paint: {
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    minZoom,
                    ['get', heightField],
                    maxZoom,
                    ['get', heightField],
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    minZoom,
                    ['get', baseHeightField],
                    maxZoom,
                    ['get', baseHeightField],
                ],
                // Height-based color variation for depth
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', heightField],
                    0,
                    '#d4c4a8',
                    10,
                    '#c4b498',
                    20,
                    '#b4a488',
                    50,
                    '#a49478',
                    100,
                    '#948468',
                ],
                'fill-extrusion-opacity': opacity,
                'fill-extrusion-vertical-gradient': true,
                'fill-extrusion-vertical-gradient-ratio': 0.5,
            },
            layout: {
                visibility: visible ? 'visible' : 'none',
            },
        }),
        [
            sourceId,
            sourceLayer,
            heightField,
            baseHeightField,
            opacity,
            minZoom,
            maxZoom,
            visible,
        ]
    );

    // Add lighting effect via map light property (handled in parent component)
    return <Layer {...layer} beforeId={beforeId} />;
};

/**
 * Progressive 3D Layer
 * Renders different detail levels based on zoom
 */
export const ProgressiveThreeDLayer: React.FC<ExtrusionLayerProps> = ({
    sourceId,
    sourceLayer,
    config = {},
    visible = true,
}) => {
    const { heightField, baseHeightField, color, opacity, minZoom, maxZoom } =
        useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

    // Base layer - visible at all zoom levels
    const baseLayer: LayerSpecification = useMemo(
        () => ({
            id: `${sourceId}-3d-base`,
            type: 'fill',
            source: sourceId,
            'source-layer': sourceLayer,
            minzoom: minZoom,
            maxzoom: maxZoom,
            filter: ['all', ['==', '$type', 'Polygon'], ['has', heightField]],
            paint: {
                'fill-color': color,
                'fill-opacity': opacity * 0.5,
            },
            layout: {
                visibility: visible ? 'visible' : 'none',
            },
        }),
        [
            sourceId,
            sourceLayer,
            heightField,
            color,
            opacity,
            minZoom,
            maxZoom,
            visible,
        ]
    );

    // Extrusion layer - visible at higher zoom levels
    const extrusionLayer: LayerSpecification = useMemo(
        () => ({
            id: `${sourceId}-3d-extrusion`,
            type: 'fill-extrusion',
            source: sourceId,
            'source-layer': sourceLayer,
            minzoom: Math.max(minZoom, 15),
            maxzoom: maxZoom,
            filter: [
                'all',
                ['==', '$type', 'Polygon'],
                ['has', heightField],
                ['>', ['get', heightField], 0],
            ],
            paint: {
                'fill-extrusion-height': ['get', heightField],
                'fill-extrusion-base': ['get', baseHeightField],
                'fill-extrusion-color': color,
                'fill-extrusion-opacity': opacity,
            },
            layout: {
                visibility: visible ? 'visible' : 'none',
            },
        }),
        [
            sourceId,
            sourceLayer,
            heightField,
            baseHeightField,
            color,
            opacity,
            minZoom,
            maxZoom,
            visible,
        ]
    );

    // Outline layer for definition
    const outlineLayer: LayerSpecification = useMemo(
        () => ({
            id: `${sourceId}-3d-outline`,
            type: 'line',
            source: sourceId,
            'source-layer': sourceLayer,
            minzoom: Math.max(minZoom, 16),
            maxzoom: maxZoom,
            filter: [
                'all',
                ['==', '$type', 'Polygon'],
                ['has', heightField],
                ['>', ['get', heightField], 10],
            ],
            paint: {
                'line-color': '#333',
                'line-width': 0.5,
                'line-opacity': 0.5,
            },
            layout: {
                visibility: visible ? 'visible' : 'none',
            },
        }),
        [sourceId, sourceLayer, heightField, minZoom, maxZoom, visible]
    );

    return (
        <>
            <Layer {...baseLayer} />
            <Layer {...extrusionLayer} />
            <Layer {...outlineLayer} />
        </>
    );
};

/**
 * Calculate building height from levels
 * Assuming 3 meters per level
 */
export const heightFromLevels = (levels: number): number => {
    return levels * 3;
};

/**
 * Validate extrusion data
 * Ensures required fields are present
 */
export const validateExtrusionData = (
    properties: Record<string, unknown>
): boolean => {
    const height = properties.height ?? properties.levels;
    return typeof height === 'number' && height > 0;
};

/**
 * Create extrusion style for a map
 */
export interface ExtrusionStyle {
    /** Main extrusion layer */
    extrusionLayer: LayerSpecification;
    /** Optional outline layer */
    outlineLayer?: LayerSpecification;
    /** Light configuration for the map */
    light?: {
        color: string;
        intensity: number;
        position: [number, number, number];
    };
}

export function createExtrusionStyle(
    sourceId: string,
    sourceLayer: string,
    options: {
        color?: string;
        opacity?: number;
        heightField?: string;
        baseHeightField?: string;
        minZoom?: number;
        maxZoom?: number;
        enableLighting?: boolean;
    } = {}
): ExtrusionStyle {
    const {
        color = DEFAULT_COLOR,
        opacity = 0.9,
        heightField = 'height',
        baseHeightField = 'base_height',
        minZoom = 13,
        maxZoom = 22,
        enableLighting = true,
    } = options;

    const extrusionLayer: LayerSpecification = {
        id: `${sourceId}-extrusion`,
        type: 'fill-extrusion',
        source: sourceId,
        'source-layer': sourceLayer,
        minzoom: minZoom,
        maxzoom: maxZoom,
        filter: [
            'all',
            ['==', '$type', 'Polygon'],
            ['has', heightField],
            ['>', ['get', heightField], 0],
        ],
        paint: {
            'fill-extrusion-height': ['get', heightField],
            'fill-extrusion-base': ['get', baseHeightField],
            'fill-extrusion-color': color,
            'fill-extrusion-opacity': opacity,
            'fill-extrusion-vertical-gradient': enableLighting,
        },
    };

    const outlineLayer: LayerSpecification = {
        id: `${sourceId}-extrusion-outline`,
        type: 'line',
        source: sourceId,
        'source-layer': sourceLayer,
        minzoom: Math.max(minZoom, 16),
        maxzoom: maxZoom,
        filter: [
            'all',
            ['==', '$type', 'Polygon'],
            ['has', heightField],
            ['>', ['get', heightField], 10],
        ],
        paint: {
            'line-color': '#222',
            'line-width': 0.5,
        },
    };

    const light = enableLighting
        ? {
              color: '#ffffff',
              intensity: 0.5,
              position: [1.5, 1.5, 2] as [number, number, number],
          }
        : undefined;

    return {
        extrusionLayer,
        outlineLayer,
        light,
    };
}
