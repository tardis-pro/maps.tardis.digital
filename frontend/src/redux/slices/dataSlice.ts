import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { featureCollection } from '@turf/helpers';

// Define the dataset interface
export interface Dataset {
  id: string;
  name: string;
  description?: string;
  data: featureCollection;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    source?: string;
    attribution?: string;
    featureCount?: number;
    bbox?: [number, number, number, number];
    properties?: string[];
  };
}

// Define the state interface
export interface DataState {
  datasets: Record<string, Dataset>;
  activeDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: DataState = {
  datasets: {},
  activeDatasetId: null,
  isLoading: false,
  error: null
};

// Async thunk for loading a GeoJSON file
export const loadGeoJSON = createAsyncThunk(
  'data/loadGeoJSON',
  async (file: File, { rejectWithValue }) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate that it's a GeoJSON FeatureCollection
      if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        return rejectWithValue('Invalid GeoJSON: Not a FeatureCollection');
      }
      
      // Create a dataset object
      const dataset: Dataset = {
        id: uuidv4(),
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        data: data as FeatureCollection,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          featureCount: data.features.length,
          properties: data.features.length > 0 ? Object.keys(data.features[0].properties || {}) : []
        }
      };
      
      return dataset;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load GeoJSON');
    }
  }
);

// Create the slice
const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    // Add a dataset
    addDataset: (state, action: PayloadAction<Dataset>) => {
      const dataset = action.payload;
      state.datasets[dataset.id] = dataset;
      state.activeDatasetId = dataset.id;
    },
    
    // Remove a dataset
    removeDataset: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.datasets[id];
      
      // If the active dataset was deleted, set active to null
      if (state.activeDatasetId === id) {
        state.activeDatasetId = null;
      }
    },
    
    // Set the active dataset
    setActiveDataset: (state, action: PayloadAction<string>) => {
      state.activeDatasetId = action.payload;
    },
    
    // Update dataset metadata
    updateDatasetMetadata: (state, action: PayloadAction<{ id: string; metadata: Partial<Dataset> }>) => {
      const { id, metadata } = action.payload;
      if (state.datasets[id]) {
        state.datasets[id] = {
          ...state.datasets[id],
          ...metadata,
          updatedAt: new Date().toISOString()
        };
      }
    },
    
    // Clear all datasets
    clearAllDatasets: (state) => {
      state.datasets = {};
      state.activeDatasetId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGeoJSON.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGeoJSON.fulfilled, (state, action) => {
        const dataset = action.payload;
        state.datasets[dataset.id] = dataset;
        state.activeDatasetId = dataset.id;
        state.isLoading = false;
      })
      .addCase(loadGeoJSON.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions
export const {
  addDataset,
  removeDataset,
  setActiveDataset,
  updateDatasetMetadata,
  clearAllDatasets
} = dataSlice.actions;

// Export selectors
export const selectDatasets = (state: { data: DataState }) => state.data.datasets;
export const selectActiveDataset = (state: { data: DataState }) => {
  const { activeDatasetId, datasets } = state.data;
  return activeDatasetId ? datasets[activeDatasetId] : null;
};
export const selectIsDataLoading = (state: { data: DataState }) => state.data.isLoading;
export const selectDataError = (state: { data: DataState }) => state.data.error;

// Export reducer
export default dataSlice.reducer; 