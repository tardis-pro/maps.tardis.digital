import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DeckGL from '@deck.gl/react/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { MVTLayer } from '@deck.gl/geo-layers/typed';
import { HexagonLayer, HeatmapLayer, ScatterplotLayer } from '@deck.gl/aggregation-layers/typed';
import { GeoJsonLayer, PolygonLayer, LineLayer } from '@deck.gl/layers/typed';
import { Protocol } from 'pmtiles';
import { styleFactory } from './tile';
import { RootState } from '../redux/store';
import {
    setViewState,
    setMapLoaded,
    ViewState,
    setSelectedFeature
} from '../redux/slices/mapSlice';
import {
    toggleLayerVisibility,
    updateLayerStyle,
    addLayer,
    removeLayer
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
} from '../utils/colorUtils';
import {
    DECK_CONTROLLER_OPTIONS,
    DEFAULT_STYLE_CONFIG,
    MapEvents,
    ANALYTICS_MODES,
    AGGREGATION_TYPES
} from '../config/mapConfig';
import MapControls from './controls/MapControls';
import LayerPanel from './panels/LayerPanel';
import AnalyticsPanel from './panels/AnalyticsPanel';
import ColorRampSelector from './controls/ColorRampSelector';
import BasemapSelector from './controls/BasemapSelector';
import VisualizationControls from './controls/VisualizationControls';
import LoadingIndicator from './ui/LoadingIndicator';
import Legend from './ui/Legend';

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
    // Redux state and dispatch
    const dispatch = useDispatch();
    const { viewState: reduxViewState, isMapLoaded, selectedFeature } = useSelector((state: RootState) => state.map);
    const { layers, visibleLayers } = useSelector((state: RootState) => state.layer);
    const {
        isAnalyticsRunning,
        analyticsResults,
        selectedAnalyticsMode,
        aggregationType
    } = useSelector((state: RootState) => state.analytics);

    // Refs
    const deck = useRef<any>(null);
    const mapRef = useRef<any>(null);

    // Local state
    const [style, setStyle] = useState(styleFactory(DEFAULT_STYLE_CONFIG));
    const [hoveredFeature, setHoveredFeature] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [colorRamp, setColorRamp] = useState<string>('viridis');
    const [opacity, setOpacity] = useState<number>(0.8);
    const [radius, setRadius] = useState<number>(100);
    const [elevationScale, setElevationScale] = useState<number>(1);
    const [filterRange, setFilterRange] = useState<[number, number]>([0, 100]);
    const [selectedProperty, setSelectedProperty] = useState<string>('');
    const [showTooltip, setShowTooltip] = useState<boolean>(true);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);

    // Initialize PMTiles protocol
    useEffect(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        // Listen for map view state changes from other components
        const handleMapViewChange = ({ zxy }: { zxy: [number, number, number] }) => {
            dispatch(setViewState({
                zoom: zxy[0],
                latitude: zxy[1],
                longitude: zxy[2]
            }));
        };

        eventBus.on(MapEvents.VIEW_CHANGE, handleMapViewChange);

        return () => {
            maplibregl.removeProtocol("pmtiles");
            eventBus.off(MapEvents.VIEW_CHANGE, handleMapViewChange);
        };
    }, [dispatch]);

    // Handle layer visibility changes
    useEffect(() => {
        const handleLayerToggle = ({ layer, checked }: { layer: string; checked: boolean }) => {
            dispatch(toggleLayerVisibility(layer));
        };

        const handleStyleChange = ({ layer, property, value }: { layer: string; property: string; value: any }) => {
            dispatch(updateLayerStyle({ layerId: layer, property, value }));
        };

        eventBus.on(MapEvents.LAYER_TOGGLE, handleLayerToggle);
        eventBus.on(MapEvents.STYLE_CHANGE, handleStyleChange);

        return () => {
            eventBus.off(MapEvents.LAYER_TOGGLE, handleLayerToggle);
            eventBus.off(MapEvents.STYLE_CHANGE, handleStyleChange);
        };
    }, [dispatch]);

    // Store map reference when available
    useEffect(() => {
        if (mapRef.current) {
            dispatch(setMapLoaded(true));
        }
    }, [mapRef.current, dispatch]);

    // Handle analytics mode changes
    useEffect(() => {
        if (selectedAnalyticsMode && isMapLoaded) {
            setIsLoading(true);

            // Run the appropriate analytics based on selected mode
            switch (selectedAnalyticsMode) {
                case ANALYTICS_MODES.SPATIAL_JOIN:
                    dispatch(performSpatialJoin({
                        targetLayerId: visibleLayers[0],
                        sourceLayerId: visibleLayers[1],
                        property: selectedProperty
                    }));
                    break;
                case ANALYTICS_MODES.CLUSTERING:
                    dispatch(calculateClusterStats({
                        layerId: visibleLayers[0],
                        radius,
                        property: selectedProperty
                    }));
                    break;
                case ANALYTICS_MODES.POINT_IN_POLYGON:
                    dispatch(runPointInPolygonAnalysis({
                        pointsLayerId: visibleLayers[0],
                        polygonsLayerId: visibleLayers[1]
                    }));
                    break;
                case ANALYTICS_MODES.ISOCHRONES:
                    dispatch(generateIsochronesForPoints({
                        pointsLayerId: visibleLayers[0],
                        travelTime: [5, 10, 15]
                    }));
                    break;
                default:
                    break;
            }

            setIsLoading(false);
        }
    }, [selectedAnalyticsMode, isMapLoaded, visibleLayers, selectedProperty, radius, dispatch]);

    // Create deck.gl layers based on redux state
    const deckLayers = useMemo(() => {
        return layers
            .filter(layer => visibleLayers.includes(layer.id))
            .map(layer => {
                const scaleFunction = generateScaleFunction(
                    layer.data?.features || [],
                    selectedProperty,
                    colorRamp,
                    filterRange
                );

                switch (layer.type) {
                    case 'mvt':
                        return new MVTLayer({
                            id: layer.id,
                            data: layer.url,
                            pickable: true,
                            autoHighlight: true,
                            highlightColor: [255, 255, 255, 128],
                            opacity: layer.style?.opacity || opacity,
                            getFillColor: (d: any) => {
                                if (selectedProperty && d.properties[selectedProperty]) {
                                    return getColorForValue(d.properties[selectedProperty], colorRamp, filterRange);
                                }
                                return layer.style?.fillColor || [255, 140, 0, 255 * opacity];
                            },
                            getLineColor: layer.style?.lineColor || [0, 0, 0, 255],
                            getLineWidth: layer.style?.lineWidth || 1,
                            lineWidthUnits: 'pixels',
                            lineWidthScale: 1,
                            onHover: (info: any) => {
                                setHoveredFeature(info.object);
                                setTooltipPosition(info.x && info.y ? { x: info.x, y: info.y } : null);
                            },
                            onClick: (info: any) => {
                                if (info.object) {
                                    dispatch(setSelectedFeature(info.object));
                                }
                            },
                            updateTriggers: {
                                getFillColor: [selectedProperty, colorRamp, filterRange, opacity]
                            }
                        });
                    case 'geojson':
                        return new GeoJsonLayer({
                            id: layer.id,
                            data: layer.data,
                            pickable: true,
                            stroked: true,
                            filled: true,
                            extruded: layer.style?.extruded || false,
                            lineWidthScale: 1,
                            lineWidthMinPixels: 1,
                            getFillColor: (d: any) => {
                                if (selectedProperty && d.properties[selectedProperty]) {
                                    return getColorForValue(d.properties[selectedProperty], colorRamp, filterRange);
                                }
                                return layer.style?.fillColor || [255, 140, 0, 255 * opacity];
                            },
                            getLineColor: layer.style?.lineColor || [0, 0, 0, 255],
                            getLineWidth: layer.style?.lineWidth || 1,
                            getElevation: (d: any) => {
                                if (layer.style?.extruded && selectedProperty && d.properties[selectedProperty]) {
                                    return d.properties[selectedProperty] * elevationScale;
                                }
                                return 0;
                            },
                            onHover: (info: any) => {
                                setHoveredFeature(info.object);
                                setTooltipPosition(info.x && info.y ? { x: info.x, y: info.y } : null);
                            },
                            onClick: (info: any) => {
                                if (info.object) {
                                    dispatch(setSelectedFeature(info.object));
                                }
                            },
                            updateTriggers: {
                                getFillColor: [selectedProperty, colorRamp, filterRange, opacity],
                                getElevation: [selectedProperty, elevationScale]
                            }
                        });
                    case 'heatmap':
                        return new HeatmapLayer({
                            id: layer.id,
                            data: layer.data,
                            getPosition: (d: any) => d.geometry.coordinates,
                            getWeight: (d: any) => {
                                if (selectedProperty && d.properties[selectedProperty]) {
                                    return d.properties[selectedProperty];
                                }
                                return 1;
                            },
                            radiusPixels: radius,
                            intensity: layer.style?.intensity || 1,
                            threshold: layer.style?.threshold || 0.05,
                            colorRange: colorRamps[colorRamp] || colorRamps.viridis,
                            updateTriggers: {
                                getWeight: [selectedProperty],
                                colorRange: [colorRamp]
                            }
                        });
                    case 'hexagon':
                        return new HexagonLayer({
                            id: layer.id,
                            data: layer.data,
                            getPosition: (d: any) => d.geometry.coordinates,
                            getElevationWeight: (d: any) => {
                                if (selectedProperty && d.properties[selectedProperty]) {
                                    return d.properties[selectedProperty];
                                }
                                return 1;
                            },
                            elevationScale,
                            extruded: true,
                            radius,
                            coverage: layer.style?.coverage || 0.8,
                            upperPercentile: filterRange[1],
                            lowerPercentile: filterRange[0],
                            colorRange: colorRamps[colorRamp] || colorRamps.viridis,
                            material: {
                                ambient: 0.64,
                                diffuse: 0.6,
                                shininess: 32,
                                specularColor: [51, 51, 51]
                            },
                            updateTriggers: {
                                getElevationWeight: [selectedProperty],
                                colorRange: [colorRamp],
                                upperPercentile: [filterRange[1]],
                                lowerPercentile: [filterRange[0]]
                            }
                        });
                    default:
                        return null;
                }
            })
            .filter(Boolean);
    }, [
        layers,
        visibleLayers,
        colorRamp,
        opacity,
        radius,
        elevationScale,
        filterRange,
        selectedProperty,
        dispatch
    ]);

    // Handle WebGL initialization
    const onInitialized = (gl: WebGLRenderingContext) => {
        initializeWebGL(gl);
    };

    // Handle view state changes
    const onViewStateChange = ({ viewState }: { viewState: ViewState }) => {
        dispatch(setViewState(viewState));
        eventBus.emit(MapEvents.VIEW_CHANGE, {
            zxy: [viewState.zoom, viewState.latitude, viewState.longitude]
        });
    };

    // Handle basemap style changes
    const handleBasemapChange = (newStyle: string) => {
        setStyle(styleFactory({ ...DEFAULT_STYLE_CONFIG, baseStyle: newStyle }));
    };

    // Handle color ramp changes
    const handleColorRampChange = (newRamp: string) => {
        setColorRamp(newRamp);
    };

    // Handle opacity changes
    const handleOpacityChange = (newOpacity: number) => {
        setOpacity(newOpacity);
    };

    // Handle radius changes
    const handleRadiusChange = (newRadius: number) => {
        setRadius(newRadius);
    };

    // Handle elevation scale changes
    const handleElevationScaleChange = (newScale: number) => {
        setElevationScale(newScale);
    };

    // Handle filter range changes
    const handleFilterRangeChange = (newRange: [number, number]) => {
        setFilterRange(newRange);
    };

    // Handle property selection for visualization
    const handlePropertyChange = (property: string) => {
        setSelectedProperty(property);
    };

    // Tooltip component
    const renderTooltip = () => {
        if (!hoveredFeature || !tooltipPosition || !showTooltip) return null;

        return (
            <div
                style={{
                    position: 'absolute',
                    zIndex: 1,
                    pointerEvents: 'none',
                    left: tooltipPosition.x + 10,
                    top: tooltipPosition.y + 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxWidth: '300px'
                }}
            >
                <div><strong>Layer:</strong> {hoveredFeature.layer?.id || 'Unknown'}</div>
                {hoveredFeature.properties && Object.entries(hoveredFeature.properties).map(([key, value]) => (
                    <div key={key}><strong>{key}:</strong> {String(value)}</div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DeckGL
                ref={deck}
                controller={DECK_CONTROLLER_OPTIONS}
                initialViewState={initialViewState || reduxViewState}
                viewState={reduxViewState}
                onViewStateChange={onViewStateChange}
                onWebGLInitialized={onInitialized}
                layers={deckLayers}
                getTooltip={({ object }) => object && showTooltip ? object.properties : null}
                style={{ zIndex: 1 }}
            >
                <Map
                    reuseMaps={false}
                    hash
                    ref={mapRef}
                    mapLib={maplibregl}
                    mapStyle={mapStyle || style}
                    className={className}
                />
            </DeckGL>

            {/* Visualization Controls */}
            {showControls && (
                <MapControls
                    position="top-right"
                    onBasemapChange={handleBasemapChange}
                    onExportMap={() => {
                        const canvas = deck.current?.deck?.canvas;
                        if (canvas) {
                            const link = document.createElement('a');
                            link.download = 'map-export.png';
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                        }
                    }}
                />
            )}

            {/* Layer Panel */}
            {showLayerPanel && (
                <LayerPanel
                    layers={layers}
                    visibleLayers={visibleLayers}
                    onToggleLayer={(layerId, checked) => {
                        eventBus.emit(MapEvents.LAYER_TOGGLE, { layer: layerId, checked });
                    }}
                    onStyleChange={(layerId, property, value) => {
                        eventBus.emit(MapEvents.STYLE_CHANGE, { layer: layerId, property, value });
                    }}
                    onAddLayer={(layer) => {
                        dispatch(addLayer(layer));
                    }}
                    onRemoveLayer={(layerId) => {
                        dispatch(removeLayer(layerId));
                    }}
                />
            )}

            {/* Analytics Panel */}
            {showAnalyticsPanel && (
                <AnalyticsPanel
                    layers={layers}
                    visibleLayers={visibleLayers}
                    selectedAnalyticsMode={selectedAnalyticsMode}
                    aggregationType={aggregationType}
                    results={analyticsResults}
                    isRunning={isAnalyticsRunning}
                    onModeChange={(mode) => {
                        eventBus.emit(MapEvents.ANALYTICS_MODE_CHANGE, { mode });
                    }}
                    onAggregationTypeChange={(type) => {
                        eventBus.emit(MapEvents.AGGREGATION_TYPE_CHANGE, { type });
                    }}
                    onPropertySelect={handlePropertyChange}
                />
            )}

            {/* Visualization Controls Panel */}
            <VisualizationControls
                colorRamp={colorRamp}
                opacity={opacity}
                radius={radius}
                elevationScale={elevationScale}
                filterRange={filterRange}
                showTooltip={showTooltip}
                onColorRampChange={handleColorRampChange}
                onOpacityChange={handleOpacityChange}
                onRadiusChange={handleRadiusChange}
                onElevationScaleChange={handleElevationScaleChange}
                onFilterRangeChange={handleFilterRangeChange}
                onTooltipToggle={() => setShowTooltip(!showTooltip)}
            />

            {/* Map Legend */}
            {selectedProperty && (
                <Legend
                    colorRamp={colorRamp}
                    property={selectedProperty}
                    range={filterRange}
                    position="bottom-left"
                />
            )}

            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}

            {/* Tooltip */}
            {renderTooltip()}
        </div>
    );
};

export default BaseMap;