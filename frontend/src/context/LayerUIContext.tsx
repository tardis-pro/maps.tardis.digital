import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import type { Layer } from '../services/akgda/models/Layer';

interface LayerUIContextValue {
    activeLayers: Set<string>;
    selectedLayer: Layer | null;
    toggleLayerVisibility: (id: string) => void;
    setActiveLayers: (ids: string[]) => void;
    setSelectedLayer: (layer: Layer | null) => void;
    isLayerActive: (id: string) => boolean;
}

const LayerUIContext = createContext<LayerUIContextValue | undefined>(
    undefined
);

export function LayerUIProvider({ children }: { children: ReactNode }) {
    const [activeLayers, setActiveLayersState] = useState<Set<string>>(
        new Set()
    );
    const [selectedLayer, setSelectedLayerState] = useState<Layer | null>(null);

    const toggleLayerVisibility = useCallback((id: string) => {
        setActiveLayersState((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const setActiveLayers = useCallback((ids: string[]) => {
        setActiveLayersState(new Set(ids));
    }, []);

    const setSelectedLayer = useCallback((layer: Layer | null) => {
        setSelectedLayerState(layer);
    }, []);

    const isLayerActive = useCallback(
        (id: string) => {
            return activeLayers.has(id);
        },
        [activeLayers]
    );

    return (
        <LayerUIContext.Provider
            value={{
                activeLayers,
                selectedLayer,
                toggleLayerVisibility,
                setActiveLayers,
                setSelectedLayer,
                isLayerActive,
            }}
        >
            {children}
        </LayerUIContext.Provider>
    );
}

export function useLayerUI() {
    const context = useContext(LayerUIContext);
    if (!context) {
        throw new Error('useLayerUI must be used within a LayerUIProvider');
    }
    return context;
}
