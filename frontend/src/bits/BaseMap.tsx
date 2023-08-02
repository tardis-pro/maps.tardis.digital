import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { MVTLayer, ScreenGridLayer } from 'deck.gl/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { lightingEffect } from '../effects/lights';
import { isWebGL2 } from '@luma.gl/core';
import * as d3 from 'd3';
import eventBus from 'utils/eventBus';

// Define the color range
var colorRange = [
    [0, 255, 0, 255], // Red, fully opaque
    [255, 0, 0, 255] // Green, fully opaque
]; // Example: Red to Green
// Create a color scale
var colorScale = d3.scaleLinear()
    .domain([0, 1])
    .range(colorRange)



const pointsLayer = new MVTLayer({
    id: 'mvt-layer',
    data: ["http://127.0.0.1:36687/mvt_tile/{z}/{x}/{y}?source_id=3"],
    pointRadiusUnits: 'pixels',
    getRadius: 3,
    getFillColor: f => {
        console.log(f.properties.value)
        console.log(colorScale(f.properties.value))
        return colorScale(f.properties.value)
    }
});


const BaseMap = (props) => {
    const { viewState } = props;
    const [layerVisibility, setLayerVisibility] = useState({ 'Stores': true, 'Sales': true })
    const deck = useRef(null);
    const layers = useMemo(() => {
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
            })
        ]
        return layers
    }, [layerVisibility])


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
        eventBus.on('widget.map.layer.add', ({layer, checked}) => {
            toggleLayer(layer, checked)
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
            onWebGLInitialized={onInitialized}
            style={{ zIndex: 1 }}
        >
            <Map
                reuseMaps
                mapLib={maplibregl}
                mapStyle={'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'}
            />
        </DeckGL>
    );
};

export default BaseMap;

