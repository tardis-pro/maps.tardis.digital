import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import layerReducer from './slices/layerSlice';

const rootReducer = combineReducers({
    map: mapReducer,
    ui: uiReducer,
    auth: authReducer,
    layers: layerReducer
});

export type RootState = ReturnType<typeof rootReducer>;

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type AppDispatch = typeof store.dispatch;

export default store;
