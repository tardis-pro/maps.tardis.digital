import React, { useState } from 'react';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import { lightingEffect } from '../effects/lights';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';


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
    state: { viewState: ViewState, layers: any[], mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' }

    constructor(props: { viewState: ViewState }) {
        super(props);
        this.state = {
            viewState: props.viewState,
            layers: [],
            mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        }
    }

    render() {
        return <DeckGL effects={[lightingEffect]} controller={true}
            initialViewState={this.props.viewState} layers={this.state.layers} >
            <Map reuseMaps mapLib={maplibregl} mapStyle={this.state.mapStyle} preventStyleDiffing={true} >.
                <Sidebar />

            </Map>

        </DeckGL>;
    }
}
