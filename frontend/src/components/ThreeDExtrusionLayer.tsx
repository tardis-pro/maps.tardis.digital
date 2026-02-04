/**
 * 3D Digital Twin Extrusion Layer
 *
 * Renders 3D building extrusions based on height attributes.
 * Supports both MapLibre fill-extrusion and Deck.gl PolygonLayer.
 */

import React, { useMemo } from 'react';
import { PolygonLayer } from '@deck.gl/layers';
import { LayerProps } from '@deck.gl/core';
import { GeoJSONLayer } from 'react-map-gl';

// Feature types
export interface BuildingFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  properties: {
    height?: number;
    levels?: number;
    base_height?: number;
    level_height?: number;
    color?: string;
    [key: string]: unknown;
  };
}

export interface ExtrusionLayerProps {
  id?: string;
  data: BuildingFeature[] | GeoJSON.FeatureCollection;
  /** Height attribute name (default: 'height') */
  heightField?: string;
  /** Base height attribute (for buildings on stilts) */
  baseHeightField?: string;
  /** Meters per level (default: 3) */
  metersPerLevel?: number;
  /** Extruded height multiplier */
  heightScale?: number;
  /** Default color if no color property */
  defaultColor?: [number, number, number];
  /** Extruded opacity (0-1) */
  opacity?: number;
  /** Whether to show 3D (false = flat) */
  extruded?: boolean;
  /** Wireframe mode */
  wireframe?: boolean;
  /** Lighting effect */
  lighting?: boolean;
  /** Current zoom level for LOD */
  zoom?: number;
  /** Minimum zoom for 3D */
  minZoom3D?: number;
  /** Auto-rotate camera */
  autoRotate?: boolean;
  /** Rotation speed */
  rotationSpeed?: number;
}

/**
 * Calculate building height from properties
 */
export function calculateBuildingHeight(
  properties: BuildingFeature['properties'],
  options: { metersPerLevel?: number; heightScale?: number } = {}
): number {
  const { metersPerLevel = 3, heightScale = 1 } = options;

  // Priority: explicit height > levels * meters_per_level
  if (properties.height) {
    return properties.height * heightScale;
  }

  if (properties.levels) {
    return properties.levels * metersPerLevel * heightScale;
  }

  return 0;
}

/**
 * Calculate base height for elevation
 */
export function calculateBaseHeight(properties: BuildingFeature['properties']): number {
  return properties.base_height ?? 0;
}

/**
 * Create extrusion style for MapLibre
 */
export function createExtrusionStyle(
  properties: BuildingFeature['properties'],
  options: { defaultColor?: [number, number, number]; opacity?: number } = {}
): maplibregl.Style {
  const { defaultColor = [200, 200, 200], opacity = 0.9 } = options;

  const color = properties.color
    ? hexToRgb(properties.color)
    : defaultColor;

  return {
    'fill-extrusion-color': `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
    'fill-extrusion-height': calculateBuildingHeight(properties),
    'fill-extrusion-base': calculateBaseHeight(properties),
    'fill-extrusion-opacity': opacity,
  };
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [200, 200, 200];
}

/**
 * 3D Extrusion Layer using Deck.gl PolygonLayer
 */
export const ThreeDExtrusionLayer: React.FC<ExtrusionLayerProps> = ({
  id = 'extrusion-layer',
  data,
  heightField = 'height',
  baseHeightField = 'base_height',
  metersPerLevel = 3,
  heightScale = 1,
  defaultColor = [200, 200, 200],
  opacity = 0.9,
  extruded = true,
  wireframe = false,
  lighting = true,
  zoom = 15,
  minZoom3D = 14,
  autoRotate = false,
  rotationSpeed = 0.5,
}) => {
  // Convert FeatureCollection to array
  const features = useMemo(() => {
    if ('features' in data) {
      return data.features as BuildingFeature[];
    }
    return data as BuildingFeature[];
  }, [data]);

  // Process features for Deck.gl
  const processedData = useMemo(() => {
    return features.map((feature) => {
      const props = feature.properties ?? {};
      const height = calculateBuildingHeight(props, { metersPerLevel, heightScale });
      const baseHeight = calculateBaseHeight(props);
      const color = props.color
        ? hexToRgb(props.color)
        : defaultColor;

      return {
        ...feature,
        properties: {
          ...props,
          _height: height,
          _baseHeight: baseHeight,
          _color: color,
        },
      };
    });
  }, [features, metersPerLevel, heightScale, defaultColor]);

  // Create layer
  const layer = useMemo(() => {
    return new PolygonLayer<BuildingFeature>({
      id,
      data: processedData,
      pickable: true,
      stroked: wireframe,
      filled: !wireframe,
      extruded,
      wireframe,
      getPolygon: (d) => {
        const coords = d.geometry.coordinates;
        if (d.geometry.type === 'MultiPolygon') {
          return coords[0]; // Use first polygon
        }
        return coords[0];
      },
      getElevation: (d) => d.properties._height,
      getFillColor: (d) => [...d.properties._color, opacity * 255],
      getLineColor: [0, 0, 0, opacity * 255],
      getLineWidth: 1,
      material: lighting
        ? {
            ambient: 0.3,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [60, 64, 70],
          }
        : undefined,
      updateTriggers: {
        getElevation: [heightField, metersPerLevel, heightScale],
        getFillColor: [defaultColor, opacity],
      },
    });
  }, [id, processedData, extruded, wireframe, opacity, lighting, heightField, metersPerLevel, heightScale, defaultColor]);

  return <>{layer}</>;
};

/**
 * Progressive 3D Layer with Level of Detail
 * Shows more detail at higher zoom levels
 */
export const ProgressiveThreeDLayer: React.FC<ExtrusionLayerProps> = ({
  data,
  zoom = 15,
  minZoom3D = 14,
  ...props
}) => {
  // Determine LOD based on zoom
  const lod = useMemo(() => {
    if (zoom < minZoom3D) {
      return 'none'; // Show flat
    } else if (zoom < 16) {
      return 'simple'; // Simple extrusions
    } else if (zoom < 18) {
      return 'detailed'; // Detailed with colors
    }
    return 'full'; // Full detail with lighting
  }, [zoom, minZoom3D]);

  const extrusionProps = useMemo(() => {
    switch (lod) {
      case 'none':
        return { extruded: false, lighting: false };
      case 'simple':
        return { extruded: true, lighting: false, opacity: 0.7 };
      case 'detailed':
        return { extruded: true, lighting: true, opacity: 0.85 };
      case 'full':
        return { extruded: true, lighting: true, opacity: 0.95 };
      default:
        return {};
    }
  }, [lod]);

  return (
    <ThreeDExtrusionLayer
      data={data}
      zoom={zoom}
      minZoom3D={minZoom3D}
      {...props}
      {...extrusionProps}
    />
  );
};

/**
 * 3D Extrusion Controls Component
 */
export const ExtrusionControls: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  heightScale: number;
  onHeightScaleChange: (value: number) => void;
  autoRotate: boolean;
  onAutoRotateChange: (value: boolean) => void;
}> = ({
  enabled,
  onToggle,
  heightScale,
  onHeightScaleChange,
  autoRotate,
  onAutoRotateChange,
}) => {
  return (
    <div className="extrusion-controls">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
        />
        3D View
      </label>

      {enabled && (
        <>
          <label>
            Height Scale: {heightScale}x
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={heightScale}
              onChange={(e) => onHeightScaleChange(parseFloat(e.target.value))}
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => onAutoRotateChange(e.target.checked)}
            />
            Auto Rotate
          </label>
        </>
      )}
    </div>
  );
};

export default ThreeDExtrusionLayer;
