import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { ScatterplotLayer, MVTLayer, ScreenGridLayer } from 'deck.gl/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { lightingEffect } from '../effects/lights';
import { isWebGL2 } from '@luma.gl/core';
import * as d3 from 'd3';
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
// const polygonLayer = new MVTLayer({
//     id: 'mvt-polygon-layer',
//     data: "http://127.0.0.1:43929/mvt_tile?source_id=3",
//     getFillColor: f => {
//         console.log(f.properties.nrf)
//         console.log(colorScale(f.properties.nrf))
//         const colorVal = colorScale(f.properties.arf)
//         console.log(colorVal.toString())
//        return colorVal;
//     },
//     pickable: true,
//     autoHighlight: true,
//     onClick: info => console.log(info.object)
// });
// new ScreenGridLayer({
//     id: 'grid',
//     data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/screen-grid/uber-pickup-locations.json',
//     opacity: 0.8,
//     getPosition: d => [d[0], d[1]],
//     getWeight: d => d[2],
//     cellSizePixels: 20,
//     colorRange: colorRange,
//     gpuAggregation: true,
//     aggregation: 'SUM'
// })

const BaseMap = (props) => {
    const { viewState } = props;

    const [state, setState] = useState({
        layers: [
            // polygonLayer,
            pointsLayer
        ],
        mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    });

    const onInitialized = gl => {
        if (!isWebGL2(gl)) {
            console.warn('GPU aggregation is not supported');
            if (disableGPUAggregation) {
                disableGPUAggregation();
            }
        }
    };

    useEffect(() => {
        // your logic here when component mounts or updates
    }, [viewState]);
    
    const handleContextMenu = (event) => {
        event.preventDefault();
      }

    return (
        <DeckGL
            effects={[lightingEffect]}
            controller={true}
            initialViewState={viewState}
            layers={state.layers}
            onWebGLInitialized={onInitialized}
            style={{zIndex:1}}
        >
            <Map
                reuseMaps
                mapLib={maplibregl}
                mapStyle={state.mapStyle}
            />
        </DeckGL>
    );
};

export default BaseMap;
