import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { V1Service } from '../../services/akgda/services/V1Service';
import { Layer } from '../../services/akgda/models/Layer';

interface LayerState {
    layers: Layer[];
    activeLayers: string[];
    selectedLayer: Layer | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: LayerState = {
    layers: [],
    activeLayers: [],
    selectedLayer: null,
    isLoading: false,
    error: null
};

// Async thunks for layers
export const fetchLayers = createAsyncThunk(
    'layers/fetchLayers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await V1Service.v1LayersList();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch layers');
        }
    }
);

export const createLayer = createAsyncThunk(
    'layers/createLayer',
    async (layer: Layer, { rejectWithValue }) => {
        try {
            const response = await V1Service.v1LayersCreate(layer);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create layer');
        }
    }
);

export const updateLayer = createAsyncThunk(
    'layers/updateLayer',
    async ({ id, layer }: { id: number; layer: Layer }, { rejectWithValue }) => {
        try {
            const response = await V1Service.v1LayersUpdate(id, layer);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update layer');
        }
    }
);

export const deleteLayer = createAsyncThunk(
    'layers/deleteLayer',
    async (id: number, { rejectWithValue }) => {
        try {
            await V1Service.v1LayersDestroy(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete layer');
        }
    }
);

const layerSlice = createSlice({
    name: 'layers',
    initialState,
    reducers: {
        toggleLayerVisibility: (state, action: PayloadAction<string>) => {
            const layerId = action.payload;
            if (state.activeLayers.includes(layerId)) {
                state.activeLayers = state.activeLayers.filter(id => id !== layerId);
            } else {
                state.activeLayers.push(layerId);
            }
        },
        setActiveLayers: (state, action: PayloadAction<string[]>) => {
            state.activeLayers = action.payload;
        },
        setSelectedLayer: (state, action: PayloadAction<Layer | null>) => {
            state.selectedLayer = action.payload;
        },
        clearLayerError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch layers
        builder.addCase(fetchLayers.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchLayers.fulfilled, (state, action) => {
            state.isLoading = false;
            state.layers = action.payload;
        });
        builder.addCase(fetchLayers.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Create layer
        builder.addCase(createLayer.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(createLayer.fulfilled, (state, action) => {
            state.isLoading = false;
            state.layers.push(action.payload);
        });
        builder.addCase(createLayer.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Update layer
        builder.addCase(updateLayer.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(updateLayer.fulfilled, (state, action) => {
            state.isLoading = false;
            const index = state.layers.findIndex(layer => layer.id === action.payload.id);
            if (index !== -1) {
                state.layers[index] = action.payload;
            }
            if (state.selectedLayer?.id === action.payload.id) {
                state.selectedLayer = action.payload;
            }
        });
        builder.addCase(updateLayer.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Delete layer
        builder.addCase(deleteLayer.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(deleteLayer.fulfilled, (state, action) => {
            state.isLoading = false;
            state.layers = state.layers.filter(layer => layer.id !== action.payload);
            state.activeLayers = state.activeLayers.filter(id => id !== action.payload.toString());
            if (state.selectedLayer?.id === action.payload) {
                state.selectedLayer = null;
            }
        });
        builder.addCase(deleteLayer.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });
    }
});

export const {
    toggleLayerVisibility,
    setActiveLayers,
    setSelectedLayer,
    clearLayerError
} = layerSlice.actions;

export default layerSlice.reducer;
