import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { GeoJsonLayer, MVTLayer, ScreenGridLayer, TextLayer } from 'deck.gl/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { lightingEffect } from '../effects/lights';
import { isWebGL2 } from '@luma.gl/core';
import eventBus from 'utils/eventBus';
import { charusat, pointData } from './cit';

// Define the color range
var colorRange = [
    [0, 255, 0, 255], // Red, fully opaque
    [255, 0, 0, 255] // Green, fully opaque
]; // Example: Red to Green
// Create a color scale
// var colorScale = d3.scaleLinear()
//     .domain([0, 1])
//     .range(colorRange)



// const pointsLayer = new MVTLayer({
//     id: 'mvt-layer',
//     data: ["http://127.0.0.1:36687/mvt_tile/{z}/{x}/{y}?source_id=3"],
//     pointRadiusUnits: 'pixels',
//     getRadius: 3,
//     getFillColor: f => {
//         console.log(f.properties.value)
//         console.log(colorScale(f.properties.value))
//         return colorScale(f.properties.value)
//     }
// });

const geojsonLayer = new GeoJsonLayer({
    data: charusat,
    opacity: 0.8,
    filled: true,
    visible: true,
    getFillColor: [0, 0, 255, 200],
    pickable: true,
    getText: f => f.properties.name,
    getTextAnchor: 'middle'
});
const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
};
const layer = new TextLayer({
    id: 'text-layer',
    data: [pointData],
    pickable: true,
    getPosition: d => d.geometry.coordinates,
    getText: d => d.properties.name,
    getSize: 32,
    getAngle: 0,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: ICON_MAPPING,
    getIcon: d => 'marker',
    sizeScale: 1/2,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center'
});
const BaseMap = (props) => {
    const { initialViewState } = props;
    const [layerVisibility, setLayerVisibility] = useState({ 'Stores': true, 'Sales': true })
    const deck = useRef(null);
    const mapRef = useRef(null);
    window.mapRef = mapRef;
    const [viewState, setViewState] = useState(initialViewState);
    useEffect(() => {
        let protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        return () => {
            maplibregl.removeProtocol("pmtiles");
        }
    }, []);

    const layers = useMemo(() => {
        const iconSizeScale = scaleLinear()
            .domain([14, 32]) // Zoom levels
            .range([20, 30]);

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
            geojsonLayer,
            layer
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
            onViewStateChange={e => {
                console.log(e.viewState);
            }}
            onWebGLInitialized={onInitialized}

        >
            <Map
                reuseMaps
                ref={mapRef}
                mapLib={maplibregl}
                mapStyle={style}
                onClick={(e) => {
                    const features = mapRef?.current?.queryRenderedFeatures(e.point);
                    const displayProperties = [
                        'type',
                        'properties',
                        'id',
                        'layer',
                        'source',
                        'sourceLayer',
                        'state'
                    ];
            
                    const displayFeatures = features.map((feat) => {
                        const displayFeat = {};
                        displayProperties.forEach((prop) => {
                            displayFeat[prop] = feat[prop];
                        });
                        return displayFeat;
                    });
                    console.log(displayFeatures);
            
                }}
            />
        </DeckGL>
    );
};

export default BaseMap;

