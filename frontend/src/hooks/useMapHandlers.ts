import { useEffect, RefObject } from 'react';
import { useDispatch } from 'react-redux';
import { ViewState, setViewState, setMapLoaded } from '../redux/slices/mapSlice';
import { toggleLayerVisibility } from '../redux/slices/layerSlice';
import eventBus from '../utils/eventBus';
import { MapEvents } from '../config/mapConfig';
import maplibregl from 'maplibre-gl';
// Import Protocol directly as it's imported in the original file
import { Protocol } from 'pmtiles';

/**
 * Custom hook to handle map-related side effects and event listeners
 */
export const useMapHandlers = (mapRef: RefObject<any>) => {
    const dispatch = useDispatch();

    // Initialize PMTiles protocol
    useEffect(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        // Listen for map view state changes from other components
        const handleMapViewChange = ({ zxy }: { zxy: [number, number, number] }) => {
            dispatch(setViewState({
                zoom: zxy[0],
                latitude: zxy[1],
                longitude: zxy[2]
            }));
        };

        eventBus.on(MapEvents.VIEW_CHANGE, handleMapViewChange);

        return () => {
            maplibregl.removeProtocol("pmtiles");
            eventBus.off(MapEvents.VIEW_CHANGE, handleMapViewChange);
        };
    }, [dispatch]);

    // Handle layer visibility changes
    useEffect(() => {
        const handleLayerToggle = ({ layer, checked }: { layer: string; checked: boolean }) => {
            dispatch(toggleLayerVisibility(layer));
        };

        eventBus.on(MapEvents.LAYER_TOGGLE, handleLayerToggle);

        return () => {
            eventBus.off(MapEvents.LAYER_TOGGLE, handleLayerToggle);
        };
    }, [dispatch]);

    // Store map reference when available
    useEffect(() => {
        if (mapRef.current) {
            dispatch(setMapLoaded(true));
        }
    }, [mapRef.current, dispatch]);

    // Handle view state changes
    const onViewStateChange = ({ viewState }: { viewState: ViewState }) => {
        dispatch(setViewState(viewState));
        eventBus.emit(MapEvents.VIEW_CHANGE, {
            zxy: [viewState.zoom, viewState.latitude, viewState.longitude]
        });
    };

    return {
        onViewStateChange
    };
};
