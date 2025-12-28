/**
 * Map configuration settings
 * Centralizes all map-related configuration for better maintainability
 */

// Base map tile source URL
export const MAP_TILE_SOURCE =
    'http://localhost:3000/planet-full-poi-0-v2.2.2.3';

// Default view state settings
export const DEFAULT_VIEW_STATE = {
    longitude: 77.58548,
    latitude: 12.94401,
    zoom: 12,
    pitch: 0,
    bearing: 0,
    maxZoom: 24,
    minZoom: 1.5,
};

// Controller settings for DeckGL
export const DECK_CONTROLLER_OPTIONS = {
    doubleClickZoom: false,
    scrollZoom: { smooth: true, speed: 0.1 },
    inertia: 300,
    minPitch: 0,
    maxPitch: 79,
};

// Event bus event names
export enum MapEvents {
    VIEW_CHANGE = 'widget.map.zxy.change',
    LAYER_TOGGLE = 'widget.map.layer.add',
}

// Style factory configuration
export const DEFAULT_STYLE_CONFIG = {
    sources: {
        openmaptiles: MAP_TILE_SOURCE,
    },
    exclusion: ['vectordata'],
};
