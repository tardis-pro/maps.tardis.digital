import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  setAnalyticsMode, 
  updateSpatialOperations,
  updateStatisticalOperations,
  updateTemporalOperations,
  performSpatialAnalysis,
  performStatisticalAnalysis,
  performTemporalAnalysis,
  clearAnalysisResults,
  removeAnalysisResult,
  AnalyticsMode
} from '../redux/slices/analyticsSlice';
import { RootState } from '../redux/types';
import '../effects/AnalyticsPanel.css';

const AnalyticsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    selectedAnalyticsMode,
    datasets,
    selectedDatasetIds,
    spatialOperations,
    statisticalOperations,
    temporalOperations,
    analysisResults,
    isLoading
  } = useSelector((state: RootState) => state.analytics);

  // Local state for form inputs
  const [bufferDistance, setBufferDistance] = useState<number>(spatialOperations.buffer);
  const [selectedSpatialOperation, setSelectedSpatialOperation] = useState<string>('buffer');
  const [selectedStatOperation, setSelectedStatOperation] = useState<string>('clustering');
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [timeStepValue, setTimeStepValue] = useState<number>(temporalOperations.timeStep);

  // Update local state when redux state changes
  useEffect(() => {
    setBufferDistance(spatialOperations.buffer);
    setTimeStepValue(temporalOperations.timeStep);
  }, [spatialOperations.buffer, temporalOperations.timeStep]);

  const handleModeChange = (mode: AnalyticsMode) => {
    dispatch(setAnalyticsMode(mode));
  };

  const handleSpatialAnalysis = () => {
    const params = {
      operation: selectedSpatialOperation,
      params: {
        buffer: bufferDistance,
        intersection: spatialOperations.intersection,
        union: spatialOperations.union,
        difference: spatialOperations.difference,
        datasets: selectedDatasetIds
      }
    };
    dispatch(performSpatialAnalysis(params));
  };

  const handleStatisticalAnalysis = () => {
    const params = {
      operation: selectedStatOperation,
      params: {
        clustering: statisticalOperations.clustering,
        outlierDetection: statisticalOperations.outlierDetection,
        hotspotAnalysis: statisticalOperations.hotspotAnalysis,
        datasets: selectedDatasetIds
      }
    };
    dispatch(performStatisticalAnalysis(params));
  };

  const handleTemporalAnalysis = () => {
    const params = {
      operation: 'temporal-filter',
      params: {
        timeFilter: temporalOperations.timeFilter,
        animation: temporalOperations.animation,
        timeStep: temporalOperations.timeStep,
        datasets: selectedDatasetIds
      }
    };
    dispatch(performTemporalAnalysis(params));
  };

  const handleRemoveResult = (resultId: string) => {
    dispatch(removeAnalysisResult(resultId));
  };

  const handleClearResults = () => {
    dispatch(clearAnalysisResults());
  };

  return (
    <motion.div 
      className="analytics-panel"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="analytics-header">
        <h2>Geospatial Analytics</h2>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${selectedAnalyticsMode === 'spatial' ? 'active' : ''}`}
            onClick={() => handleModeChange('spatial')}
          >
            Spatial
          </button>
          <button 
            className={`mode-btn ${selectedAnalyticsMode === 'statistical' ? 'active' : ''}`}
            onClick={() => handleModeChange('statistical')}
          >
            Statistical
          </button>
          <button 
            className={`mode-btn ${selectedAnalyticsMode === 'temporal' ? 'active' : ''}`}
            onClick={() => handleModeChange('temporal')}
          >
            Temporal
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {/* Dataset Selection */}
        <div className="dataset-section">
          <h3>Available Datasets</h3>
          <div className="dataset-list">
            {datasets.map(dataset => (
              <div key={dataset.id} className="dataset-item">
                <input
                  type="checkbox"
                  id={`dataset-${dataset.id}`}
                  checked={selectedDatasetIds.includes(dataset.id)}
                  onChange={() => {
                    if (selectedDatasetIds.includes(dataset.id)) {
                      dispatch({ type: 'analytics/deselectDataset', payload: dataset.id });
                    } else {
                      dispatch({ type: 'analytics/selectDataset', payload: dataset.id });
                    }
                  }}
                />
                <label htmlFor={`dataset-${dataset.id}`}>
                  {dataset.name} ({dataset.type})
                </label>
              </div>
            ))}
            {datasets.length === 0 && (
              <p className="empty-state">No datasets available. Upload or connect to data sources.</p>
            )}
          </div>
        </div>

        {/* Analytics Modes */}
        {selectedAnalyticsMode === 'spatial' && (
          <div className="analytics-mode-section">
            <h3>Spatial Analysis</h3>
            <div className="form-group">
              <label htmlFor="spatial-operation">Operation:</label>
              <select 
                id="spatial-operation" 
                value={selectedSpatialOperation}
                onChange={e => setSelectedSpatialOperation(e.target.value)}
              >
                <option value="buffer">Buffer</option>
                <option value="intersection">Intersection</option>
                <option value="union">Union</option>
                <option value="difference">Difference</option>
              </select>
            </div>
            
            {selectedSpatialOperation === 'buffer' && (
              <div className="form-group">
                <label htmlFor="buffer-distance">Buffer Distance (m):</label>
                <input 
                  type="range" 
                  id="buffer-distance" 
                  min="0" 
                  max="5000" 
                  step="10"
                  value={bufferDistance}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    setBufferDistance(value);
                    dispatch(updateSpatialOperations({ buffer: value }));
                  }}
                />
                <span>{bufferDistance}m</span>
              </div>
            )}
            
            {(selectedSpatialOperation === 'intersection' || 
              selectedSpatialOperation === 'union' || 
              selectedSpatialOperation === 'difference') && (
              <p>Select two or more datasets to perform this operation.</p>
            )}
            
            <button 
              className="apply-btn"
              disabled={selectedDatasetIds.length === 0 || isLoading}
              onClick={handleSpatialAnalysis}
            >
              {isLoading ? 'Processing...' : 'Apply Spatial Analysis'}
            </button>
          </div>
        )}
        
        {selectedAnalyticsMode === 'statistical' && (
          <div className="analytics-mode-section">
            <h3>Statistical Analysis</h3>
            <div className="form-group">
              <label htmlFor="stat-operation">Operation:</label>
              <select 
                id="stat-operation" 
                value={selectedStatOperation}
                onChange={e => setSelectedStatOperation(e.target.value)}
              >
                <option value="clustering">Clustering</option>
                <option value="outlier">Outlier Detection</option>
                <option value="hotspot">Hotspot Analysis</option>
              </select>
            </div>
            
            {selectedStatOperation === 'clustering' && (
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox"
                    checked={statisticalOperations.clustering}
                    onChange={e => dispatch(updateStatisticalOperations({ clustering: e.target.checked }))}
                  />
                  Enable k-means clustering
                </label>
              </div>
            )}
            
            {selectedStatOperation === 'outlier' && (
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox"
                    checked={statisticalOperations.outlierDetection}
                    onChange={e => dispatch(updateStatisticalOperations({ outlierDetection: e.target.checked }))}
                  />
                  Detect statistical outliers
                </label>
              </div>
            )}
            
            {selectedStatOperation === 'hotspot' && (
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox"
                    checked={statisticalOperations.hotspotAnalysis}
                    onChange={e => dispatch(updateStatisticalOperations({ hotspotAnalysis: e.target.checked }))}
                  />
                  Identify geographic hotspots
                </label>
              </div>
            )}
            
            <button 
              className="apply-btn"
              disabled={selectedDatasetIds.length === 0 || isLoading}
              onClick={handleStatisticalAnalysis}
            >
              {isLoading ? 'Processing...' : 'Apply Statistical Analysis'}
            </button>
          </div>
        )}
        
        {selectedAnalyticsMode === 'temporal' && (
          <div className="analytics-mode-section">
            <h3>Temporal Analysis</h3>
            <div className="form-group">
              <label htmlFor="time-filter">Time Range:</label>
              <div className="range-slider">
                <input 
                  type="range" 
                  id="time-filter-min" 
                  min="0" 
                  max="100" 
                  value={timeRange[0]}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    setTimeRange([value, timeRange[1]]);
                    dispatch(updateTemporalOperations({ timeFilter: [value, timeRange[1]] }));
                  }}
                />
                <input 
                  type="range" 
                  id="time-filter-max" 
                  min="0" 
                  max="100" 
                  value={timeRange[1]}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    setTimeRange([timeRange[0], value]);
                    dispatch(updateTemporalOperations({ timeFilter: [timeRange[0], value] }));
                  }}
                />
              </div>
              <span>Time Range: {timeRange[0]} - {timeRange[1]}</span>
            </div>
            
            <div className="form-group">
              <label>
                <input 
                  type="checkbox"
                  checked={temporalOperations.animation}
                  onChange={e => dispatch(updateTemporalOperations({ animation: e.target.checked }))}
                />
                Animate Time Series
              </label>
            </div>
            
            {temporalOperations.animation && (
              <div className="form-group">
                <label htmlFor="time-step">Animation Speed:</label>
                <input 
                  type="range" 
                  id="time-step" 
                  min="1" 
                  max="10" 
                  value={timeStepValue}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    setTimeStepValue(value);
                    dispatch(updateTemporalOperations({ timeStep: value }));
                  }}
                />
                <span>{timeStepValue}x</span>
              </div>
            )}
            
            <button 
              className="apply-btn"
              disabled={selectedDatasetIds.length === 0 || isLoading}
              onClick={handleTemporalAnalysis}
            >
              {isLoading ? 'Processing...' : 'Apply Temporal Analysis'}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        <div className="results-section">
          <div className="results-header">
            <h3>Analysis Results</h3>
            {analysisResults.length > 0 && (
              <button
                className="clear-btn"
                onClick={handleClearResults}
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="results-list">
            {analysisResults.map(result => (
              <div key={result.id} className="result-item">
                <div className="result-header">
                  <h4>{result.name}</h4>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveResult(result.id)}
                  >
                    &times;
                  </button>
                </div>
                <div className="result-content">
                  <div className="result-info">
                    <span className="result-type">{result.type}</span>
                    <span className="result-date">
                      {new Date(result.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="result-parameters">
                    {Object.entries(result.parameters).map(([key, value]) => (
                      <div key={key} className="parameter-item">
                        <span className="parameter-key">{key}:</span>
                        <span className="parameter-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {analysisResults.length === 0 && (
              <p className="empty-state">No analysis results yet. Select datasets and run an analysis.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPanel;