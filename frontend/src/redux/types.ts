import { AnalyticsState } from './slices/analyticsSlice';
import { AuthState } from './slices/authSlice';
import { LayerState } from './slices/layerSlice';
import { MapState } from './slices/mapSlice';
import { UiState } from './slices/uiSlice';
import { VisualizationState } from './slices/visualizationSlice';
import { DataState } from './slices/dataSlice';
import { AnalysisState } from './slices/analysisSlice';
import { Store } from '@reduxjs/toolkit';

export interface RootState {
    map: MapState;
    ui: UiState;
    auth: AuthState;
    layers: LayerState;
    analytics: AnalyticsState;
    visualization: VisualizationState;
    data: DataState;
    analysis: AnalysisState;
}

export type AppDispatch = Store<RootState>['dispatch']; 