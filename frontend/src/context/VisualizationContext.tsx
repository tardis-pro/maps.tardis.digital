import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Color ramps
export const COLOR_RAMPS = {
    viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
    magma: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'],
    plasma: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'],
    inferno: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'],
    turbo: ['#30123b', '#4145ab', '#4675ed', '#39a7ff', '#1bcfd4', '#28ea8d', '#6dff70', '#b5de2b', '#fde724'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
};

export type ColorRamp = keyof typeof COLOR_RAMPS;

export type AggregationType = 'none' | 'grid' | 'hexbin' | 'cluster' | 'heatmap';

export interface VisualizationSettings {
    datasetId: string;
    property: string;
    colorRamp: ColorRamp;
    opacity: number;
    radius: number;
    filterRange: [number, number];
    aggregation: AggregationType;
    aggregationResolution: number;
    showLegend: boolean;
    elevationScale?: number;
    extruded?: boolean;
}

interface VisualizationContextValue {
    visualizationSettings: Record<string, VisualizationSettings>;
    dataColor: Record<string, string> | undefined;
    updateVisualizationSettings: (settings: VisualizationSettings) => void;
    removeVisualizationSettings: (datasetId: string) => void;
    setDataColor: (colors: Record<string, string>) => void;
    updateColorRamp: (datasetId: string, colorRamp: ColorRamp) => void;
    updateOpacity: (datasetId: string, opacity: number) => void;
    updateRadius: (datasetId: string, radius: number) => void;
    updateFilterRange: (datasetId: string, filterRange: [number, number]) => void;
    updateAggregation: (datasetId: string, aggregation: AggregationType) => void;
    updateAggregationResolution: (datasetId: string, aggregationResolution: number) => void;
    toggleLegend: (datasetId: string, showLegend: boolean) => void;
    updateElevationScale: (datasetId: string, elevationScale: number) => void;
    toggleExtruded: (datasetId: string, extruded: boolean) => void;
    resetVisualizationSettings: (datasetId: string) => void;
}

const defaultSettings: Omit<VisualizationSettings, 'datasetId' | 'property'> = {
    colorRamp: 'viridis',
    opacity: 0.8,
    radius: 10,
    filterRange: [0, 100],
    aggregation: 'none',
    aggregationResolution: 1,
    showLegend: true,
    elevationScale: 1,
    extruded: false,
};

const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

export function VisualizationProvider({ children }: { children: ReactNode }) {
    const [visualizationSettings, setVisualizationSettings] = useState<Record<string, VisualizationSettings>>({});
    const [dataColor, setDataColorState] = useState<Record<string, string> | undefined>(undefined);

    const updateVisualizationSettings = useCallback((settings: VisualizationSettings) => {
        setVisualizationSettings((prev) => ({
            ...prev,
            [settings.datasetId]: {
                ...defaultSettings,
                ...prev[settings.datasetId],
                ...settings,
            },
        }));
    }, []);

    const removeVisualizationSettings = useCallback((datasetId: string) => {
        setVisualizationSettings((prev) => {
            const next = { ...prev };
            delete next[datasetId];
            return next;
        });
    }, []);

    const setDataColor = useCallback((colors: Record<string, string>) => {
        setDataColorState(colors);
    }, []);

    const updateColorRamp = useCallback((datasetId: string, colorRamp: ColorRamp) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], colorRamp },
            };
        });
    }, []);

    const updateOpacity = useCallback((datasetId: string, opacity: number) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], opacity },
            };
        });
    }, []);

    const updateRadius = useCallback((datasetId: string, radius: number) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], radius },
            };
        });
    }, []);

    const updateFilterRange = useCallback((datasetId: string, filterRange: [number, number]) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], filterRange },
            };
        });
    }, []);

    const updateAggregation = useCallback((datasetId: string, aggregation: AggregationType) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], aggregation },
            };
        });
    }, []);

    const updateAggregationResolution = useCallback((datasetId: string, aggregationResolution: number) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], aggregationResolution },
            };
        });
    }, []);

    const toggleLegend = useCallback((datasetId: string, showLegend: boolean) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], showLegend },
            };
        });
    }, []);

    const updateElevationScale = useCallback((datasetId: string, elevationScale: number) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], elevationScale },
            };
        });
    }, []);

    const toggleExtruded = useCallback((datasetId: string, extruded: boolean) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: { ...prev[datasetId], extruded },
            };
        });
    }, []);

    const resetVisualizationSettings = useCallback((datasetId: string) => {
        setVisualizationSettings((prev) => {
            if (!prev[datasetId]) return prev;
            return {
                ...prev,
                [datasetId]: {
                    ...defaultSettings,
                    datasetId,
                    property: prev[datasetId].property,
                },
            };
        });
    }, []);

    return (
        <VisualizationContext.Provider
            value={{
                visualizationSettings,
                dataColor,
                updateVisualizationSettings,
                removeVisualizationSettings,
                setDataColor,
                updateColorRamp,
                updateOpacity,
                updateRadius,
                updateFilterRange,
                updateAggregation,
                updateAggregationResolution,
                toggleLegend,
                updateElevationScale,
                toggleExtruded,
                resetVisualizationSettings,
            }}
        >
            {children}
        </VisualizationContext.Provider>
    );
}

export function useVisualization() {
    const context = useContext(VisualizationContext);
    if (!context) {
        throw new Error('useVisualization must be used within a VisualizationProvider');
    }
    return context;
}
