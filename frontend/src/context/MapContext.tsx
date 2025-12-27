import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    maxZoom?: number;
    minZoom?: number;
}

interface MapContextValue {
    viewState: ViewState;
    baseMapStyle: string;
    isMapLoaded: boolean;
    selectedFeature: any | null;
    setViewState: (viewState: Partial<ViewState>) => void;
    setBaseMapStyle: (style: string) => void;
    setMapLoaded: (loaded: boolean) => void;
    setSelectedFeature: (feature: any | null) => void;
}

const defaultViewState: ViewState = {
    longitude: 77.58548,
    latitude: 12.94401,
    zoom: 12,
    pitch: 0,
    bearing: 0,
    maxZoom: 24,
    minZoom: 1.5,
};

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
    const [viewState, setViewStateInternal] = useState<ViewState>(defaultViewState);
    const [baseMapStyle, setBaseMapStyleState] = useState('dark');
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [selectedFeature, setSelectedFeatureState] = useState<any | null>(null);

    const setViewState = useCallback((partial: Partial<ViewState>) => {
        setViewStateInternal((prev) => ({ ...prev, ...partial }));
    }, []);

    const setBaseMapStyle = useCallback((style: string) => setBaseMapStyleState(style), []);
    const setMapLoaded = useCallback((loaded: boolean) => setIsMapLoaded(loaded), []);
    const setSelectedFeature = useCallback((feature: any | null) => setSelectedFeatureState(feature), []);

    return (
        <MapContext.Provider
            value={{
                viewState,
                baseMapStyle,
                isMapLoaded,
                selectedFeature,
                setViewState,
                setBaseMapStyle,
                setMapLoaded,
                setSelectedFeature,
            }}
        >
            {children}
        </MapContext.Provider>
    );
}

export function useMap() {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within a MapProvider');
    }
    return context;
}
