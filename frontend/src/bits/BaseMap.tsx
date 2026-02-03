import { useState, useEffect, useRef, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { MVTLayer } from '@deck.gl/geo-layers';
import { GeoJsonLayer, type Color } from 'deck.gl';
import { Protocol } from 'pmtiles';
import { useMap } from '../context/MapContext';
import { useLayerUI } from '../context/LayerUIContext';
import {
    useLayers,
    useUpdateLayer,
    useDeleteLayer,
} from '../api/queries/layers';
import type { Layer as AkgdaLayer } from '../services/akgda/models/Layer';
import { getColorForValue } from '../utils/color';
import { DECK_CONTROLLER_OPTIONS } from '../config/config';
import MapControls from './MapControls';
import LayerPanel from './LayerPanel';
import AnalyticsPanel from './AnalyticsPanel';
import LoadingIndicator from './LoadingIndicator';
import { AnalysisErrorBoundary } from '../components/errors/AnalysisErrorBoundary';

// Extended layer type for UI usage (adds type, url, data properties)
interface UILayer extends AkgdaLayer {
    type?: string;
    url?: string;
    data?: string | object;
}

// MapLibre Demo Tiles - free basemap for development
const DEFAULT_MAP_STYLE = 'https://demotiles.maplibre.org/style.json';

interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
    maxZoom?: number;
    minZoom?: number;
}

interface BaseMapProps {
    initialViewState?: ViewState;
    className?: string;
    mapStyle?: any;
    showControls?: boolean;
    showLayerPanel?: boolean;
    showAnalyticsPanel?: boolean;
}

/**
 * Enhanced BaseMap component for rendering advanced geospatial visualizations
 * Mimics CARTO and Kepler.gl functionality with MVT support and analytics
 */
const BaseMap: React.FC<BaseMapProps> = ({
    initialViewState: _initialViewState,
    className: _className = 'map',
    mapStyle = DEFAULT_MAP_STYLE,
    showControls = true,
    showLayerPanel = true,
    showAnalyticsPanel = true,
}) => {
    // Use context hooks instead of Redux
    const {
        viewState,
        setViewState,
        isMapLoaded,
        setMapLoaded: _setMapLoaded,
    } = useMap();
    const { activeLayers, toggleLayerVisibility } = useLayerUI();

    // Use React Query for layers data
    const { data: layers = [] } = useLayers();
    const updateLayerMutation = useUpdateLayer();
    const deleteLayerMutation = useDeleteLayer();

    // Analytics mode - keeping local state for now (can be moved to context later)
    const [selectedAnalyticsMode, _setSelectedAnalyticsMode] = useState<
        string | null
    >(null);

    const deck = useRef<any>(null);
    const mapRef = useRef<any>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [colorRamp, _setColorRamp] = useState<string>('viridis');
    const [opacity, _setOpacity] = useState<number>(0.8);
    const [_radius, _setRadius] = useState<number>(100);
    const [filterRange, _setFilterRange] = useState<[number, number]>([0, 100]);
    const [selectedProperty, _setSelectedProperty] = useState<string>('');

    // Initialize PMTiles protocol
    useEffect(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        return () => {
            maplibregl.removeProtocol('pmtiles');
        };
    }, []);

    // Handle analytics mode changes
    useEffect(() => {
        if (selectedAnalyticsMode && isMapLoaded) {
            setIsLoading(true);
            // Run the appropriate analytics based on selected mode
            // (Add your analytics logic here)
            setIsLoading(false);
        }
    }, [selectedAnalyticsMode, isMapLoaded]);

    // Create deck.gl layers based on context state
    const deckLayers = useMemo(() => {
        return (layers as UILayer[])
            .filter((layer) => activeLayers.has(layer.id.toString()))
            .map((layer) => {
                switch (layer.type) {
                    case 'mvt':
                        return new MVTLayer({
                            id: String(layer.id),
                            data: layer.url,
                            pickable: true,
                            opacity: layer.style?.opacity || opacity,
                            getFillColor: (d) =>
                                getColorForValue(
                                    d.properties[selectedProperty],
                                    colorRamp,
                                    filterRange
                                ) as Color,
                        });
                    case 'geojson':
                        return new GeoJsonLayer({
                            id: String(layer.id),

                            data: layer.data as any,
                            pickable: true,
                            getFillColor: (d) =>
                                getColorForValue(
                                    d.properties?.[selectedProperty],
                                    colorRamp,
                                    filterRange
                                ) as Color,
                        });
                    // Add other layer types as needed
                    default:
                        return null;
                }
            })
            .filter(Boolean);
    }, [
        layers,
        activeLayers,
        colorRamp,
        opacity,
        filterRange,
        selectedProperty,
    ]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DeckGL
                ref={deck}
                controller={DECK_CONTROLLER_OPTIONS}
                viewState={viewState}
                onViewStateChange={({ viewState: newViewState }) =>
                    setViewState(newViewState as any)
                }
                layers={deckLayers}
                style={{ zIndex: '1' }}
            >
                <Map ref={mapRef} mapLib={maplibregl} mapStyle={mapStyle} />
            </DeckGL>

            {/* Visualization Controls */}
            {showControls && (
                <MapControls
                    onBasemapChange={(_style) => {
                        /* implement basemap change */
                    }}
                    onExportMap={() => {
                        /* implement export map */
                    }}
                />
            )}
            {/* Layer Panel */}
            {showLayerPanel && (
                <LayerPanel
                    layers={(layers as UILayer[]).map((layer) => ({
                        id: String(layer.id),
                        name: layer.name,
                        type: layer.type || 'unknown',
                        url: layer.url,
                        data: layer.data,
                        style: layer.style,
                    }))}
                    activeLayers={Array.from(activeLayers)}
                    onToggleLayer={(layerId) => toggleLayerVisibility(layerId)}
                    onStyleChange={(layerId, style) =>
                        updateLayerMutation.mutate({
                            id: Number(layerId),
                            data: { style } as any,
                        })
                    }
                    onRemoveLayer={(layerId) =>
                        deleteLayerMutation.mutate(Number(layerId))
                    }
                    onLayerOrderChange={(_newOrder) => {
                        /* implement layer order change */
                    }}
                    onAddLayer={(_layer) => {
                        /* implement add layer */
                    }}
                />
            )}
            {/* Analytics Panel */}
            {showAnalyticsPanel && (
                <AnalysisErrorBoundary panelName="Analytics Panel">
                    <AnalyticsPanel />
                </AnalysisErrorBoundary>
            )}
            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}
            {/* Tooltip */}
            {/* Add your tooltip rendering logic here */}
        </div>
    );
};

export default BaseMap;
