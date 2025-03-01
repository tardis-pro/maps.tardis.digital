import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnalysisType } from '../../bits/SpatialAnalysisPanel';
import { featureCollection } from '@turf/helpers';
// Define the state structure for analysis results
export interface AnalysisResult {
  id: string;
  name: string;
  type: AnalysisType;
  data: typeof featureCollection;
  createdAt: string;
  parameters: Record<string, any>;
  sourceDatasets: string[];
}

// Define the state structure for the analysis slice
export interface AnalysisState {
  results: Record<string, AnalysisResult>;
  activeResultId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AnalysisState = {
  results: {},
  activeResultId: null,
  isLoading: false,
  error: null
};

// Create the slice
const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Start loading state
    startAnalysis: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Add a new analysis result
    addAnalysisResult: (state, action: PayloadAction<AnalysisResult>) => {
      const result = action.payload;
      state.results[result.id] = result;
      state.activeResultId = result.id;
      state.isLoading = false;
    },
    
    // Set the active result
    setActiveResult: (state, action: PayloadAction<string>) => {
      state.activeResultId = action.payload;
    },
    
    // Remove a result
    removeAnalysisResult: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.results[id];
      
      // If the active result was deleted, set active to null
      if (state.activeResultId === id) {
        state.activeResultId = null;
      }
    },
    
    // Update a result's name
    updateResultName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const { id, name } = action.payload;
      if (state.results[id]) {
        state.results[id].name = name;
      }
    },
    
    // Set error state
    setAnalysisError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    // Clear all results
    clearAllResults: (state) => {
      state.results = {};
      state.activeResultId = null;
    }
  }
});

// Export actions
export const {
  startAnalysis,
  addAnalysisResult,
  setActiveResult,
  removeAnalysisResult,
  updateResultName,
  setAnalysisError,
  clearAllResults
} = analysisSlice.actions;

// Export selectors
export const selectAnalysisResults = (state: { analysis: AnalysisState }) => state.analysis.results;
export const selectActiveResult = (state: { analysis: AnalysisState }) => {
  const { activeResultId, results } = state.analysis;
  return activeResultId ? results[activeResultId] : null;
};
export const selectIsAnalysisLoading = (state: { analysis: AnalysisState }) => state.analysis.isLoading;
export const selectAnalysisError = (state: { analysis: AnalysisState }) => state.analysis.error;

// Export reducer
export default analysisSlice.reducer; 