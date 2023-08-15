import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { GeoJsonLayer, MVTLayer, ScenegraphLayer, ScreenGridLayer, TextLayer } from 'deck.gl/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { lightingEffect } from '../effects/lights';
import { isWebGL2 } from '@luma.gl/core';
import eventBus from 'utils/eventBus';
import { pointData } from './cit';
import { scaleLinear } from 'd3-scale';
import { TardisModel } from './Tardis';
import { customStyle } from './carto-dark';
import { PMTLayer } from '@maticoapp/deck.gl-pmtiles/src';

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
const layer = new ScenegraphLayer({
    id: 'scenegraph-layer',
    data: [pointData],
    pickable: true,
    scenegraph: 'https://s3.amazonaws.com/tardis.digital/TARDIS.glb',
    getPosition: d => d.geometry.coordinates,
    getOrientation: d => [0, 0, 0],
    _animations: {
        '*': { speed: 5 }
    },
    sizeScale: 50,
    _lighting: 'pbr',
});
const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
};

const BaseMap = (props) => {
    const { initialViewState } = props;
    const [layerVisibility, setLayerVisibility] = useState({ 'Stores': true, 'Sales': true })
    const deck = useRef(null);
    const [viewState, setViewState] = useState(initialViewState);
 

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
            layer,
            // new PMTLayer({
            //     id: "pmtiles-layer",
            //     data: "https://maps-tardis-digital.s3.ap-south-1.amazonaws.com/output.pmtiles",
            //     onClick: (info) => {
            //       console.log(info);
            //     },
            //     maxZoom: 20,
            //     minZoom: 18,
            //     getFillColor: (d: any) => [255 * (+d.properties.STATEFP / 90), 0, 0],
            //     pickable: true,
            //   }),
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
                mapLib={maplibregl}
                mapStyle={customStyle}
            />
        </DeckGL>
    );
};

export default BaseMap;

