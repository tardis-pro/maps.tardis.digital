import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FeatureCollection } from 'geojson';

// Analysis types supported
export enum AnalysisType {
    BUFFER = 'buffer',
    INTERSECTION = 'intersection',
    UNION = 'union',
    DIFFERENCE = 'difference',
    POINTS_IN_POLYGON = 'pointsInPolygon',
    CLUSTER = 'cluster',
    ISOCHRONES = 'isochrones',
    HOTSPOT = 'hotspot',
}

export interface AnalysisResult {
    id: string;
    name: string;
    type: AnalysisType;
    data: FeatureCollection;
    createdAt: string;
    parameters: Record<string, unknown>;
    sourceDatasets: string[];
}

interface AnalysisContextValue {
    results: Record<string, AnalysisResult>;
    activeResultId: string | null;
    isLoading: boolean;
    error: string | null;
    startAnalysis: () => void;
    addAnalysisResult: (result: AnalysisResult) => void;
    setActiveResult: (id: string) => void;
    removeAnalysisResult: (id: string) => void;
    updateResultName: (id: string, name: string) => void;
    setAnalysisError: (error: string) => void;
    clearAllResults: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [results, setResults] = useState<Record<string, AnalysisResult>>({});
    const [activeResultId, setActiveResultId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startAnalysis = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);

    const addAnalysisResult = useCallback((result: AnalysisResult) => {
        setResults((prev) => ({
            ...prev,
            [result.id]: result,
        }));
        setActiveResultId(result.id);
        setIsLoading(false);
    }, []);

    const setActiveResult = useCallback((id: string) => {
        setActiveResultId(id);
    }, []);

    const removeAnalysisResult = useCallback((id: string) => {
        setResults((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setActiveResultId((prev) => (prev === id ? null : prev));
    }, []);

    const updateResultName = useCallback((id: string, name: string) => {
        setResults((prev) => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: { ...prev[id], name },
            };
        });
    }, []);

    const setAnalysisError = useCallback((errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);
    }, []);

    const clearAllResults = useCallback(() => {
        setResults({});
        setActiveResultId(null);
    }, []);

    return (
        <AnalysisContext.Provider
            value={{
                results,
                activeResultId,
                isLoading,
                error,
                startAnalysis,
                addAnalysisResult,
                setActiveResult,
                removeAnalysisResult,
                updateResultName,
                setAnalysisError,
                clearAllResults,
            }}
        >
            {children}
        </AnalysisContext.Provider>
    );
}

export function useAnalysis() {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
}
