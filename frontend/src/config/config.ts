// config/mapConfig.ts
import { FlyToInterpolator } from '@deck.gl/core';

// Default configuration for the map view state
export const DEFAULT_VIEW_STATE = {
  zoom: 12,
  latitude: 37.7749,
  longitude: -122.4194,
  pitch: 0,
  bearing: 0,
  transitionDuration: 300
};

// Default configuration for the map style
export const DEFAULT_STYLE_CONFIG = {
  baseStyle: 'streets', // Options: streets, satellite, dark, light, terrain
  showLabels: true,
  showBuildings: true,
  showTerrain: false,
  language: 'en'
};

// Controller options for DeckGL
export const DECK_CONTROLLER_OPTIONS = {
  doubleClickZoom: true,
  touchZoom: true,
  touchRotate: true,
  keyboard: true,
  dragPan: true,
  dragRotate: true,
  scrollZoom: true,
  inertia: true
};

// Event names for the event bus
export const MapEvents = {
  VIEW_CHANGE: 'map:view_change',
  LAYER_TOGGLE: 'map:layer_toggle',
  STYLE_CHANGE: 'map:style_change',
  ANALYTICS_MODE_CHANGE: 'map:analytics_mode_change',
  AGGREGATION_TYPE_CHANGE: 'map:aggregation_type_change',
  FEATURE_SELECT: 'map:feature_select',
  DRAWING_COMPLETE: 'map:drawing_complete'
};

// Analytics modes
export const ANALYTICS_MODES = {
  SPATIAL_JOIN: 'spatial_join',
  CLUSTERING: 'clustering',
  POINT_IN_POLYGON: 'point_in_polygon',
  ISOCHRONES: 'isochrones',
  BUFFER_ANALYSIS: 'buffer_analysis',
  HOTSPOT_ANALYSIS: 'hotspot_analysis'
};

// Aggregation types for analytics
export const AGGREGATION_TYPES = {
  COUNT: 'count',
  SUM: 'sum',
  AVERAGE: 'avg',
  MIN: 'min',
  MAX: 'max',
  MEDIAN: 'median',
  STDDEV: 'stddev'
};

// Layer types
export const LAYER_TYPES = {
  MVT: 'mvt',
  GEOJSON: 'geojson',
  HEATMAP: 'heatmap',
  HEXAGON: 'hexagon',
  GRID: 'grid',
  SCATTERPLOT: 'scatterplot',
  ARC: 'arc',
  LINE: 'line',
  POLYGON: 'polygon',
  ICON: 'icon',
  TEXT: 'text'
};

// Export transitions for smooth movement
export const TRANSITIONS = {
  FLY_TO: (duration = 1000) => ({
    transitionDuration: duration,
    transitionInterpolator: new FlyToInterpolator()
  })
};

// utils/eventBus.ts
type Callback = (...args: any[]) => void;

class EventBus {
  private events: Record<string, Callback[]> = {};

  on(event: string, callback: Callback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Callback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }

  clear(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Singleton instance
const eventBus = new EventBus();
export default eventBus;

// utils/webglUtils.ts
export const initializeWebGL = (gl: WebGLRenderingContext): void => {
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  
  // Enable alpha blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  // Set clear color (transparent background)
  gl.clearColor(0, 0, 0, 0);
  
  // Enable cull face for better performance when rendering 3D objects
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
};

// tile.ts
export const styleFactory = (config: any) => {
  // Base styles mapping
  const baseStyles = {
    streets: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    dark: 'mapbox://styles/mapbox/dark-v10',
    light: 'mapbox://styles/mapbox/light-v10',
    terrain: 'mapbox://styles/mapbox/outdoors-v11'
  };

  // This is where you'd customize the style based on configuration
  // For now, just return a basic style with the selected base
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  };
};