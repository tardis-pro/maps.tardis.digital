import React, { useState } from 'react';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import { lightingEffect } from '../effects/lights';


type ViewState = {
    longitude: number,
    latitude: number,
    zoom: number,
    minZoom: number,
    maxZoom: number,
    pitch: number,
    bearing: number
}

// create a typed react class for base map
export class BaseMap extends React.Component<{ viewState: ViewState }> {
    state: { viewState: ViewState, layers: any[] }
    constructor(props: { viewState: ViewState }) {
        super(props);
        this.state = {
            viewState: props.viewState,
            layers: []
        }
    }

    render() {
        return <DeckGL effects={[lightingEffect]} controller={true}
            initialViewState={this.props.viewState} layers={this.state.layers} >
            <Map reuseMaps mapLib={maplibregl} mapStyle='https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' preventStyleDiffing={true} />
        </DeckGL>;
    }
}
