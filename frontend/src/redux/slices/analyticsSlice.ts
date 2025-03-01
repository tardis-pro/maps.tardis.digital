import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../types';

export type AnalyticsMode = 'spatial' | 'statistical' | 'temporal' | null;

export interface Dataset {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'geojson' | 'csv';
  properties: Record<string, { type: string; description?: string }>;
  sourceUrl?: string;
  data?: any;
}

export interface AnalysisResult {
  id: string;
  name: string;
  type: string;
  createdAt: number;
  result: any;
  parameters: Record<string, any>;
}

export interface AnalyticsState {
  datasets: Dataset[];
  selectedDatasetIds: string[];
  selectedAnalyticsMode: AnalyticsMode;
  analysisResults: AnalysisResult[];
  spatialOperations: {
    buffer: number;
    intersection: boolean;
    union: boolean;
    difference: boolean;
  };
  statisticalOperations: {
    clustering: boolean;
    outlierDetection: boolean;
    hotspotAnalysis: boolean;
  };
  temporalOperations: {
    timeFilter: [number, number] | null;
    animation: boolean;
    timeStep: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  datasets: [],
  selectedDatasetIds: [],
  selectedAnalyticsMode: null,
  analysisResults: [],
  spatialOperations: {
    buffer: 0,
    intersection: false,
    union: false,
    difference: false,
  },
  statisticalOperations: {
    clustering: false,
    outlierDetection: false,
    hotspotAnalysis: false,
  },
  temporalOperations: {
    timeFilter: null,
    animation: false,
    timeStep: 1,
  },
  isLoading: false,
  error: null
};

// Thunks for analytics operations
export const performSpatialAnalysis = createAsyncThunk(
  'analytics/performSpatialAnalysis',
  async (params: { operation: string; params: any }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { datasets, selectedDatasetIds } = state.analytics;
      console.log(datasets, selectedDatasetIds)
      // Here we would perform the actual spatial analysis
      // This is a placeholder - in a real app, you'd call your analytics services
      
      const result = {
        id: `spatial-${Date.now()}`,
        name: `Spatial Analysis - ${params.operation}`,
        type: 'spatial',
        createdAt: Date.now(),
        result: { /* analysis results would go here */ },
        parameters: params.params
      };
      
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform spatial analysis');
    }
  }
);

export const performStatisticalAnalysis = createAsyncThunk(
  'analytics/performStatisticalAnalysis',
  async (params: { operation: string; params: any }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { datasets, selectedDatasetIds } = state.analytics;
      console.log(datasets, selectedDatasetIds)

      // Placeholder for statistical analysis
      
      const result = {
        id: `statistical-${Date.now()}`,
        name: `Statistical Analysis - ${params.operation}`,
        type: 'statistical',
        createdAt: Date.now(),
        result: { /* analysis results would go here */ },
        parameters: params.params
      };
      
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform statistical analysis');
    }
  }
);

export const performTemporalAnalysis = createAsyncThunk(
  'analytics/performTemporalAnalysis',
  async (params: { operation: string; params: any }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { datasets, selectedDatasetIds } = state.analytics;
      console.log(datasets, selectedDatasetIds)

      // Placeholder for temporal analysis
      
      const result = {
        id: `temporal-${Date.now()}`,
        name: `Temporal Analysis - ${params.operation}`,
        type: 'temporal',
        createdAt: Date.now(),
        result: { /* analysis results would go here */ },
        parameters: params.params
      };
      
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform temporal analysis');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsMode: (state, action: PayloadAction<AnalyticsMode>) => {
      state.selectedAnalyticsMode = action.payload;
    },
    addDataset: (state, action: PayloadAction<Dataset>) => {
      state.datasets.push(action.payload);
    },
    removeDataset: (state, action: PayloadAction<string>) => {
      state.datasets = state.datasets.filter(dataset => dataset.id !== action.payload);
      state.selectedDatasetIds = state.selectedDatasetIds.filter(id => id !== action.payload);
    },
    selectDataset: (state, action: PayloadAction<string>) => {
      if (!state.selectedDatasetIds.includes(action.payload)) {
        state.selectedDatasetIds.push(action.payload);
      }
    },
    deselectDataset: (state, action: PayloadAction<string>) => {
      state.selectedDatasetIds = state.selectedDatasetIds.filter(id => id !== action.payload);
    },
    updateSpatialOperations: (state, action: PayloadAction<Partial<AnalyticsState['spatialOperations']>>) => {
      state.spatialOperations = { ...state.spatialOperations, ...action.payload };
    },
    updateStatisticalOperations: (state, action: PayloadAction<Partial<AnalyticsState['statisticalOperations']>>) => {
      state.statisticalOperations = { ...state.statisticalOperations, ...action.payload };
    },
    updateTemporalOperations: (state, action: PayloadAction<Partial<AnalyticsState['temporalOperations']>>) => {
      state.temporalOperations = { ...state.temporalOperations, ...action.payload };
    },
    clearAnalysisResults: (state) => {
      state.analysisResults = [];
    },
    removeAnalysisResult: (state, action: PayloadAction<string>) => {
      state.analysisResults = state.analysisResults.filter(result => result.id !== action.payload);
    },
    clearAnalyticsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Spatial Analysis
    builder.addCase(performSpatialAnalysis.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(performSpatialAnalysis.fulfilled, (state, action) => {
      state.isLoading = false;
      state.analysisResults.push(action.payload);
    });
    builder.addCase(performSpatialAnalysis.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Statistical Analysis
    builder.addCase(performStatisticalAnalysis.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(performStatisticalAnalysis.fulfilled, (state, action) => {
      state.isLoading = false;
      state.analysisResults.push(action.payload);
    });
    builder.addCase(performStatisticalAnalysis.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Temporal Analysis
    builder.addCase(performTemporalAnalysis.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(performTemporalAnalysis.fulfilled, (state, action) => {
      state.isLoading = false;
      state.analysisResults.push(action.payload);
    });
    builder.addCase(performTemporalAnalysis.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  }
});

export const {
  setAnalyticsMode,
  addDataset,
  removeDataset,
  selectDataset,
  deselectDataset,
  updateSpatialOperations,
  updateStatisticalOperations,
  updateTemporalOperations,
  clearAnalysisResults,
  removeAnalysisResult,
  clearAnalyticsError
} = analyticsSlice.actions;

export default analyticsSlice.reducer; 