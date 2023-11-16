import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { ScreenGridLayer } from 'deck.gl/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { lightingEffect } from '../effects/lights';
import { Protocol } from 'pmtiles';
import { isWebGL2 } from '@luma.gl/core';
import * as d3 from 'd3';
import eventBus from 'utils/eventBus';

// Define the color range
var colorRange = [
    [0, 255, 0, 255], // Red, fully opaque
    [255, 0, 0, 255] // Green, fully opaque
]; // Example: Red to Green
// Create a color scale
// var colorScale = d3.scaleLinear()
//     .domain([0, 1])
//     .range(colorRange)

const BaseMap = (props) => {
    const { initialViewState } = props;
    const [layerVisibility, setLayerVisibility] = useState({ 'Stores': false, 'Sales': false })
    const deck = useRef(null);
    const [viewState, setViewState] = useState(initialViewState);

    useEffect(() => {
        let protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        return () => {
            maplibregl.removeProtocol("pmtiles");
        };
    }, []);

    const layers = useMemo(() => {
        const iconSizeScale = d3.scaleLinear()
            .domain([14, 32]) // Zoom levels
            .range([20, 30]);
        console.log(iconSizeScale(viewState.zoom));

        const layers = [
            new ScreenGridLayer({
                id: 'grid',
                data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/screen-grid/uber-pickup-locations.json',
                opacity: 0.8,
                visible: layerVisibility['Stores'],
                getPosition: d => [d[0], d[1]],
                getWeight: d => d[2],
                cellSizePixels: 2,
                colorRange: colorRange,
                gpuAggregation: true,
                aggregation: 'SUM',
            }),
            // new PMTLayer({
            //     id: "pmtiles-layer",
            //     data: "https://maps-tardis-digital.s3.ap-south-1.amazonaws.com/data/india_v1.pmtiles",
            //     onClick: (info) => {
            //       console.log(info);
            //     },
            //     maxZoom: 20,
            //     minZoom: 18,
            //     getFillColor: (d: any) => [255 * (+d.properties.STATEFP / 90), 0, 0],
            //     pickable: true,
            //   }),
            // new GeoJsonLayer({
            //     data: charusat,
            //     opacity: 1,
            //     filled: true,
            //     getFillColor: [57, 57, 57],
            //     visible: viewState.zoom > 11,
            //     pickable: true,
            //     getText: f => f.properties.name,
            //     getTextAnchor: 'middle'
            // }),
            // new TextLayer({
            //     id: 'text-layer',
            //     data: [],
            //     pickable: true,
            //     visible: viewState.zoom > 12,
            //     getPosition: d => d.geometry.coordinates,
            //     getText: d => d.properties.name,
            //     getColor: [223,229,236],
            //     fontWeight: 400,
            //     getSize: iconSizeScale(viewState.zoom),
            //     getAngle: 0,
            //     iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
            //     iconMapping: ICON_MAPPING,
            //     getIcon: d => 'marker',
            //     sizeScale: 1 / 2,
            //     getTextAnchor: 'middle',
            //     getAlignmentBaseline: 'center'
            // })
        ]
        return layers
    }, [layerVisibility, viewState])


    const onInitialized = gl => {
        if (!isWebGL2(gl)) {
            console.warn('GPU aggregation is not supported');
            if (disableGPUAggregation) {
                disableGPUAggregation();
            }
        }
    };

    function toggleLayer(key: any, checked: boolean) {
        const newLayerVisibility = JSON.parse(JSON.stringify(layerVisibility))
        newLayerVisibility[key] = checked
        setLayerVisibility(newLayerVisibility)
        console.log(deck.current);
    }

    useEffect(() => {
        // your logic here when component mounts or updates
        eventBus.on('widget.map.layer.add', ({ layer, checked }) => {
            toggleLayer(layer, checked)
        })
        eventBus.on('widget.map.zxy.change', ({ zxy }) => {
            console.log(viewState);
            setViewState({
                ...viewState,
                zoom: zxy[0],
                latitude: zxy[1],
                longitude: zxy[2]
            })
        })
        return () => {
            // eventBus.off('widget.map.layer.add', (layer) => {
            //     toggleLayer('Stores')
            // })
        }
    }, [viewState]);
    return (
        <DeckGL
            ref={deck}
            effects={[lightingEffect]}
            controller={{ doubleClickZoom: false, scrollZoom: { smooth: true, speed: 0.1 }, inertia: 300, minPitch: 0, maxPitch: 79 }}
            initialViewState={viewState}
            layers={layers}
            onViewStateChange={e => setViewState(e.viewState)}
            onWebGLInitialized={onInitialized}
            style={{ zIndex: 1 }}

        >
            <Map
                reuseMaps
                ref={mapRef}
                mapLib={maplibregl}
                mapStyle={{
                    version: 8,
                    sources: {
                        sample: {
                            type: "vector",
                            url:
                                "https://maps-tardis-digital.s3.ap-south-1.amazonaws.com/data/india_v1.pmtiles"
                        }
                    },
                    layers: [
                        {
                            id: "zcta",
                            source: "sample",
                            "source-layer": "zcta",
                            type: "line",
                            paint: {
                                "line-color": "#999"
                            }
                        }
                    ]
                }}
            />
        </DeckGL>
    );
};

export default BaseMap;

