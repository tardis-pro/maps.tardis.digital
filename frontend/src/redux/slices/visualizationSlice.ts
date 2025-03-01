import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Color ramps
export const COLOR_RAMPS = {
  viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
  magma: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'],
  plasma: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'],
  inferno: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'],
  turbo: ['#30123b', '#4145ab', '#4675ed', '#39a7ff', '#1bcfd4', '#28ea8d', '#6dff70', '#b5de2b', '#fde724'],
  blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
  reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
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

export interface VisualizationState {
  visualizationSettings: Record<string, VisualizationSettings>;
  dataColor?: Record<string, string>;
  isLoading: boolean;
  error: string | null;
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
  extruded: false
};

const initialState: VisualizationState = {
  visualizationSettings: {},
  isLoading: false,
  error: null
};

const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    updateVisualizationSettings: (state, action: PayloadAction<VisualizationSettings>) => {
      const { datasetId } = action.payload;
      state.visualizationSettings[datasetId] = {
        ...defaultSettings,
        ...state.visualizationSettings[datasetId],
        ...action.payload
      };
    },
    
    removeVisualizationSettings: (state, action: PayloadAction<string>) => {
      const datasetId = action.payload;
      delete state.visualizationSettings[datasetId];
    },
    
    setDataColor: (state, action: PayloadAction<Record<string, string>>) => {
      state.dataColor = action.payload;
    },
    
    updateColorRamp: (state, action: PayloadAction<{ datasetId: string; colorRamp: ColorRamp }>) => {
      const { datasetId, colorRamp } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].colorRamp = colorRamp;
      }
    },
    
    updateOpacity: (state, action: PayloadAction<{ datasetId: string; opacity: number }>) => {
      const { datasetId, opacity } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].opacity = opacity;
      }
    },
    
    updateRadius: (state, action: PayloadAction<{ datasetId: string; radius: number }>) => {
      const { datasetId, radius } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].radius = radius;
      }
    },
    
    updateFilterRange: (state, action: PayloadAction<{ datasetId: string; filterRange: [number, number] }>) => {
      const { datasetId, filterRange } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].filterRange = filterRange;
      }
    },
    
    updateAggregation: (state, action: PayloadAction<{ datasetId: string; aggregation: AggregationType }>) => {
      const { datasetId, aggregation } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].aggregation = aggregation;
      }
    },
    
    updateAggregationResolution: (state, action: PayloadAction<{ datasetId: string; aggregationResolution: number }>) => {
      const { datasetId, aggregationResolution } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].aggregationResolution = aggregationResolution;
      }
    },
    
    toggleLegend: (state, action: PayloadAction<{ datasetId: string; showLegend: boolean }>) => {
      const { datasetId, showLegend } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].showLegend = showLegend;
      }
    },
    
    updateElevationScale: (state, action: PayloadAction<{ datasetId: string; elevationScale: number }>) => {
      const { datasetId, elevationScale } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].elevationScale = elevationScale;
      }
    },
    
    toggleExtruded: (state, action: PayloadAction<{ datasetId: string; extruded: boolean }>) => {
      const { datasetId, extruded } = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId].extruded = extruded;
      }
    },
    
    resetVisualizationSettings: (state, action: PayloadAction<string>) => {
      const datasetId = action.payload;
      if (state.visualizationSettings[datasetId]) {
        state.visualizationSettings[datasetId] = {
          ...defaultSettings,
          datasetId,
          property: state.visualizationSettings[datasetId].property
        };
      }
    },
    
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
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
  clearError
} = visualizationSlice.actions;

export default visualizationSlice.reducer; 