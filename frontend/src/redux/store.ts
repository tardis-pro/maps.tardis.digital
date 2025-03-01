import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import layerReducer from './slices/layerSlice';
import analyticsReducer from './slices/analyticsSlice';
import visualizationReducer from './slices/visualizationSlice';
import dataReducer from './slices/dataSlice';
import analysisReducer from './slices/analysisSlice';
import { RootState } from './types';

// Create the store
const rootStore = configureStore({
    reducer: {
        map: mapReducer,
        ui: uiReducer,
        auth: authReducer,
        layers: layerReducer,
        analytics: analyticsReducer,
        visualization: visualizationReducer,
        data: dataReducer,
        analysis: analysisReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

// Export types
export type { RootState } from './types';
export type AppDispatch = typeof rootStore.dispatch;

export default rootStore;
