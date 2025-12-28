import { useEffect, RefObject } from 'react';
import { useMap } from '../context/MapContext';
import { useLayerUI } from '../context/LayerUIContext';
import eventBus from '../utils/eventBus';
import { MapEvents } from '../config/mapConfig';
import maplibregl from 'maplibre-gl';
// Import Protocol directly as it's imported in the original file
import { Protocol } from 'pmtiles';

interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
}

/**
 * Custom hook to handle map-related side effects and event listeners
 */
export const useMapHandlers = (mapRef: RefObject<any>) => {
    // Use context hooks instead of Redux
    const { setViewState, setMapLoaded } = useMap();
    const { toggleLayerVisibility } = useLayerUI();

    // Initialize PMTiles protocol
    useEffect(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        // Listen for map view state changes from other components
        const handleMapViewChange = (data: unknown) => {
            const { zxy } = data as { zxy: [number, number, number] };
            setViewState({
                zoom: zxy[0],
                latitude: zxy[1],
                longitude: zxy[2],
            });
        };

        const proxyFunc = eventBus.on(
            MapEvents.VIEW_CHANGE,
            handleMapViewChange
        );

        return () => {
            maplibregl.removeProtocol('pmtiles');
            eventBus.off(MapEvents.VIEW_CHANGE, proxyFunc);
        };
    }, [setViewState]);

    // Handle layer visibility changes
    useEffect(() => {
        const handleLayerToggle = (data: unknown) => {
            const { layer } = data as { layer: string; checked: boolean };
            toggleLayerVisibility(layer);
        };

        const proxyFunc = eventBus.on(
            MapEvents.LAYER_TOGGLE,
            handleLayerToggle
        );

        return () => {
            eventBus.off(MapEvents.LAYER_TOGGLE, proxyFunc);
        };
    }, [toggleLayerVisibility]);

    // Store map reference when available
    useEffect(() => {
        if (mapRef.current) {
            setMapLoaded(true);
        }
    }, [mapRef.current, setMapLoaded]);

    // Handle view state changes
    const onViewStateChange = ({ viewState }: { viewState: ViewState }) => {
        setViewState(viewState);
        eventBus.emit(MapEvents.VIEW_CHANGE, {
            zxy: [viewState.zoom, viewState.latitude, viewState.longitude],
        });
    };

    return {
        onViewStateChange,
    };
};
