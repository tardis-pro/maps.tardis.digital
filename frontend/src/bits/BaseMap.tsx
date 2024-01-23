// organize this code in a reusable fashion

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
import { styleFactory } from './tile';
import * as dat from 'dat.gui';

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
    let s = styleFactory({
        "sources": {
            "openmaptiles": "http://localhost:3000/planet-full-poi-0-v2.2.2.3",
        },
        "exclusion": ["vectordata"]
    }) 
    const gui = new dat.GUI();

    const [style, setStyle] = useState(s);
    const deck = useRef(null);
    const debug = true;
    const [viewState, setViewState] = useState(initialViewState);
    const mapRef = useRef(null);
    useEffect(() => {
        let protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        
        eventBus.on('widget.map.zxy.change', ({ zxy }) => {
            debugBasemap("poi");
           
            setViewState({
                ...viewState,
                zoom: zxy[0],
                latitude: zxy[1],
                longitude: zxy[2]
            })
        })
        return () => {
            maplibregl.removeProtocol("pmtiles");
        };
        

    }, []);
    

    const onInitialized = gl => {
        if (!isWebGL2(gl)) {
            console.warn('GPU aggregation is not supported');
            if (disableGPUAggregation) {
                disableGPUAggregation();
            }
        }
    };


    const debugBasemap = (layerName) => {
        if(false && layerName &&  window[props.className]?.mapref) {
            const mapRefLocal = window[props.className].mapref;
            const classes = new Set(mapRefLocal.style.querySourceFeatures('openmaptiles', { sourceLayer:layerName}).map(a => a.properties.class))
            const subclasses = new Set(mapRefLocal.style.querySourceFeatures('openmaptiles', { sourceLayer:layerName}).map(a => a.properties.subclass))
            // const pop = mapRefLocal.style.querySourceFeatures('openmaptiles', { sourceLayer:layerName}).map(a => a.properties.pop)
            console.log(`source: "${props.className} \n "sourceLayer: ${layerName}
             \n classes: ${Array.from(classes).join(',')}
             \n subclasses: ${Array.from(subclasses).join(',')}
             \n featureCount: ${mapRefLocal.style.querySourceFeatures('openmaptiles', { sourceLayer:layerName}).length}
             `);
              //  \n pop: ${pop.join(',')}
        }
    }
    function toggleLayer(key: any, checked: boolean) {
        const newLayerVisibility = JSON.parse(JSON.stringify(layerVisibility))
        newLayerVisibility[key] = checked
        setLayerVisibility(newLayerVisibility)
    }

    useEffect(() => {
        // your logic here when component mounts or updates
        if(mapRef.current) {
            window[props.className] = {};
            window[props.className].mapref = mapRef.current.getMap();
        }
        eventBus.on('widget.map.layer.add', ({ layer, checked }) => {
            toggleLayer(layer, checked)
        })
        
    }, [viewState]);
    return (
        <DeckGL
            ref={deck}
            controller={{ doubleClickZoom: false, scrollZoom: { smooth: true, speed: 0.1 }, inertia: 300, minPitch: 0, maxPitch: 79 }}
            initialViewState={viewState}
            // onViewStateChange={e =>  eventBus.emit('widget.map.zxy.change', { zxy: [e.viewState.zoom, e.viewState.latitude, e.viewState.longitude] })}
            onWebGLInitialized={onInitialized}
            style={{ zIndex: 1 }}
        >
            <Map
                reuseMaps={false}
                hash
                ref={mapRef}
                sho
                mapLib={maplibregl}
                mapStyle={props.mapStyle || style}
            />
        </DeckGL>
    );
};

export default BaseMap;

