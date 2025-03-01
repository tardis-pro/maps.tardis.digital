import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    maxZoom?: number;
    minZoom?: number;
}

export interface MapState {
    viewState: ViewState;
    baseMapStyle: string;
    isMapLoaded: boolean;
    selectedFeature: any | null;
}

const initialState: MapState = {
    viewState: {
        longitude: 77.58548,
        latitude: 12.94401,
        zoom: 12,
        pitch: 0,
        bearing: 0,
        maxZoom: 24,
        minZoom: 1.5
    },
    baseMapStyle: 'dark',
    isMapLoaded: false,
    selectedFeature: null
};

const mapSlice = createSlice({
    name: 'map',
    initialState,
    reducers: {
        setViewState: (state, action: PayloadAction<Partial<ViewState>>) => {
            state.viewState = { ...state.viewState, ...action.payload };
        },
        setBaseMapStyle: (state, action: PayloadAction<string>) => {
            state.baseMapStyle = action.payload;
        },
        setMapLoaded: (state, action: PayloadAction<boolean>) => {
            state.isMapLoaded = action.payload;
        },
        setSelectedFeature: (state, action: PayloadAction<any | null>) => {
            state.selectedFeature = action.payload;
        }
    }
});

export const { setViewState, setBaseMapStyle, setMapLoaded, setSelectedFeature } = mapSlice.actions;

export default mapSlice.reducer;
