import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { MVTLayer } from '@deck.gl/geo-layers';
import { HexagonLayer, HeatmapLayer, ScatterplotLayer } from '@deck.gl/aggregation-layers';
import { Protocol } from 'pmtiles';
import { styleFactory } from './tile';
import { RootState } from '../redux/types';

import {
    setViewState,
    setMapLoaded,
    ViewState,
    setSelectedFeature
} from '../redux/slices/mapSlice';
import {
    toggleLayerVisibility,
    updateLayer,
    deleteLayer
} from '../redux/slices/layerSlice';
import {
    performSpatialJoin,
    calculateClusterStats,
    runPointInPolygonAnalysis,
    generateIsochronesForPoints
} from '../redux/slices/analyticsSlice';
import eventBus from '../utils/eventBus';
import { initializeWebGL } from '../utils/webglUtils';
import {
    colorRamps,
    generateScaleFunction,
    getColorForValue
} from '../utils/color';
import {
    DECK_CONTROLLER_OPTIONS,
    DEFAULT_STYLE_CONFIG,
    MapEvents,
    ANALYTICS_MODES
} from '../config/config';
import MapControls from './MapControls';
import LayerPanel from './LayerPanel';
import AnalyticsPanel from './AnalyticsPanel';
import VisualizationControls from './VisualizationControls';
import LoadingIndicator from './LoadingIndicator';
import Legend from './Legend';
import { GeoJsonLayer } from 'deck.gl';

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
    initialViewState,
    className = 'map',
    mapStyle,
    showControls = true,
    showLayerPanel = true,
    showAnalyticsPanel = true
}) => {
    const dispatch = useDispatch();
    const { viewState: reduxViewState, isMapLoaded } = useSelector((state: RootState) => state.map);
    const { layers, activeLayers } = useSelector((state: RootState) => state.layers);
    const { selectedAnalyticsMode } = useSelector((state: RootState) => state.analytics);

    const deck = useRef<any>(null);
    const mapRef = useRef<any>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [colorRamp, setColorRamp] = useState<string>('viridis');
    const [opacity, setOpacity] = useState<number>(0.8);
    const [radius, setRadius] = useState<number>(100);
    const [filterRange, setFilterRange] = useState<[number, number]>([0, 100]);
    const [selectedProperty, setSelectedProperty] = useState<string>('');

    // Initialize PMTiles protocol
    useEffect(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        return () => {
            maplibregl.removeProtocol("pmtiles");
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

    // Create deck.gl layers based on redux state
    const deckLayers = useMemo(() => {
        return layers
            .filter(layer => activeLayers.includes(layer.id.toString()))
            .map(layer => {
                switch (layer.type) {
                    case 'mvt':
                        return new MVTLayer({
                            id: layer.id,
                            data: layer.url,
                            pickable: true,
                            opacity: layer.style?.opacity || opacity,
                            getFillColor: d => getColorForValue(d.properties[selectedProperty], colorRamp, filterRange),
                        });
                    case 'geojson':
                        return new GeoJsonLayer({
                            id: layer.id,
                            data: layer.data,
                            pickable: true,
                            getFillColor: d => getColorForValue(d.properties[selectedProperty], colorRamp, filterRange),
                        });
                    // Add other layer types as needed
                    default:
                        return null;
                }
            })
            .filter(Boolean);
    }, [layers, activeLayers, colorRamp, opacity, filterRange, selectedProperty]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DeckGL
                ref={deck}
                controller={DECK_CONTROLLER_OPTIONS}
                initialViewState={initialViewState || reduxViewState}
                viewState={reduxViewState}
                layers={deckLayers}
                style={{ zIndex: 1 }}
            >
                <Map
                    ref={mapRef}
                    mapLib={maplibregl}
                    mapStyle={mapStyle}
                    className={className}
                />
            </DeckGL>

            {/* Visualization Controls */}
            {showControls && <MapControls />}
            {/* Layer Panel */}
            {showLayerPanel && (
                <LayerPanel
                    layers={layers}
                    activeLayers={activeLayers}
                    onToggleLayer={(layerId) => dispatch(toggleLayerVisibility(layerId))}
                    onStyleChange={(layerId, style) => dispatch(updateLayer({ id: layerId, style }))}
                    onRemoveLayer={(layerId) => dispatch(deleteLayer(layerId))}
                    onLayerOrderChange={(newOrder) => {/* implement layer order change */}}
                    onAddLayer={(layer) => {/* implement add layer */}}
                />
            )}
            {/* Analytics Panel */}
            {showAnalyticsPanel && <AnalyticsPanel />}
            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}
            {/* Tooltip */}
            {/* Add your tooltip rendering logic here */}
        </div>
    );
};

export default BaseMap;