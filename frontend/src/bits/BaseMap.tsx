// import React, { useState } from 'react';
// import { Map } from 'react-map-gl';
// import maplibregl from 'maplibre-gl';
// import DeckGL from '@deck.gl/react';
// import { lightingEffect } from '../effects/lights';
// import { Sidebar } from './Sidebar';
// import { createMvtLayer } from '../utils/layer';


// type ViewState = {
//     longitude: number,
//     latitude: number,
//     zoom: number,
//     minZoom: number,
//     maxZoom: number,
//     pitch: number,
//     bearing: number
// }

// // create a typed react class for base map
// export class BaseMap extends React.Component<{ viewState: ViewState }> {
//     state: { viewState: ViewState, layers: any[], mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' }

//     constructor(props: { viewState: ViewState }) {
//         super(props);
//         const layer= createMvtLayer('http://localhost:3000/mvt_tile/{z}/{x}/{y}?source_id=16', 'rainfalldev')
//         this.state = {
//             viewState: props.viewState,
//             layers: [layer],
//             mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
//         }
//     }

//     onLayerAdd = (layer: any) => {
        
//     }

//     onLayerRemove = (layer: any) => {
//     }

//     render() {
//         return <DeckGL effects={[lightingEffect]} controller={true}
//             initialViewState={this.props.viewState} layers={this.state.layers} >
//             <Map reuseMaps mapLib={maplibregl} mapStyle={this.state.mapStyle}>.
               

//             </Map>
//         </DeckGL>;
//     }
// }
