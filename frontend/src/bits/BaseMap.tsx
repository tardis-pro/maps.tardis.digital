import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { ScatterplotLayer, ScreenGridLayer } from 'deck.gl/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { lightingEffect } from '../effects/lights';
import {isWebGL2} from '@luma.gl/core';

const colorRange = [
    [255, 255, 178, 25],
    [254, 217, 118, 85],
    [254, 178, 76, 127],
    [253, 141, 60, 170],
    [240, 59, 32, 212],
    [189, 0, 38, 255]
];

const BaseMap = (props) => {
    const { viewState } = props;

    const [state, setState] = useState({
        layers: [
            new ScreenGridLayer({
                id: 'grid',
                data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/screen-grid/uber-pickup-locations.json',
                opacity: 0.8,
                getPosition: d => [d[0], d[1]],
                getWeight: d => d[2],
                cellSizePixels: 20,
                colorRange: colorRange,
                gpuAggregation: true,
                aggregation: 'SUM'
            })
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

    return (
        <DeckGL 
            effects={[lightingEffect]} 
            controller={true}
            initialViewState={viewState} 
            layers={state.layers} 
            onWebGLInitialized={onInitialized}
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
