import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { AuthProvider } from '../context/AuthContext';
import { UIProvider } from '../context/UIContext';
import { MapProvider } from '../context/MapContext';
import { ToastProvider } from '../context/ToastContext';
import { VisualizationProvider } from '../context/VisualizationContext';
import { AnalysisProvider } from '../context/AnalysisContext';
import { LayerUIProvider } from '../context/LayerUIContext';
import { GlobalErrorBoundary } from '../components/errors/GlobalErrorBoundary';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <GlobalErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <AuthProvider>
                        <UIProvider>
                            <MapProvider>
                                <VisualizationProvider>
                                    <AnalysisProvider>
                                        <LayerUIProvider>
                                            {children}
                                        </LayerUIProvider>
                                    </AnalysisProvider>
                                </VisualizationProvider>
                            </MapProvider>
                        </UIProvider>
                    </AuthProvider>
                </ToastProvider>
            </QueryClientProvider>
        </GlobalErrorBoundary>
    );
}
