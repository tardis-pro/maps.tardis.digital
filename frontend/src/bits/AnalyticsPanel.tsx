import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    useAnalysis,
    AnalysisResult,
    AnalysisType,
} from '../context/AnalysisContext';
import { useVisualization } from '../context/VisualizationContext';

// Analytics mode type
type AnalyticsMode = 'spatial' | 'statistical' | 'temporal';

// Dataset type for local state
interface Dataset {
    id: string;
    name: string;
    type: string;
}

const AnalyticsPanel: React.FC = () => {
    // Use Analysis context for results management
    const {
        results: analysisResultsMap,
        isLoading: analysisLoading,
        addAnalysisResult,
        removeAnalysisResult,
        clearAllResults,
    } = useAnalysis();

    // Use Visualization context for visualization settings (reserved for future use)
    const { visualizationSettings: _visualizationSettings } =
        useVisualization();

    // Convert results map to array for rendering
    const analysisResults = Object.values(analysisResultsMap);

    // Local state for analytics (previously from Redux)
    const [selectedAnalyticsMode, setSelectedAnalyticsMode] =
        useState<AnalyticsMode>('spatial');
    const [datasets] = useState<Dataset[]>([]);
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
    const [spatialOperations, setSpatialOperations] = useState({
        buffer: 100,
        intersection: false,
        union: false,
        difference: false,
    });
    const [statisticalOperations, setStatisticalOperations] = useState({
        clustering: false,
        outlierDetection: false,
        hotspotAnalysis: false,
    });
    const [temporalOperations, setTemporalOperations] = useState({
        timeFilter: [0, 100] as [number, number],
        animation: false,
        timeStep: 1,
    });
    const [isLoading] = useState(false);

    // Local state for form inputs
    const [bufferDistance, setBufferDistance] = useState<number>(
        spatialOperations.buffer
    );
    const [selectedSpatialOperation, setSelectedSpatialOperation] =
        useState<string>('buffer');
    const [selectedStatOperation, setSelectedStatOperation] =
        useState<string>('clustering');
    const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
    const [timeStepValue, setTimeStepValue] = useState<number>(
        temporalOperations.timeStep
    );

    const handleModeChange = (mode: AnalyticsMode) => {
        setSelectedAnalyticsMode(mode);
    };

    const handleSpatialAnalysis = () => {
        // Create analysis result and add to context
        const result: AnalysisResult = {
            id: `spatial-${Date.now()}`,
            name: `Spatial Analysis - ${selectedSpatialOperation}`,
            type: AnalysisType.BUFFER, // Default, should be mapped based on operation
            data: { type: 'FeatureCollection', features: [] }, // Placeholder
            createdAt: new Date().toISOString(),
            parameters: {
                operation: selectedSpatialOperation,
                buffer: bufferDistance,
                intersection: spatialOperations.intersection,
                union: spatialOperations.union,
                difference: spatialOperations.difference,
                datasets: selectedDatasetIds,
            },
            sourceDatasets: selectedDatasetIds,
        };

        addAnalysisResult(result);
    };

    const handleStatisticalAnalysis = () => {
        // Create analysis result and add to context
        const result: AnalysisResult = {
            id: `statistical-${Date.now()}`,
            name: `Statistical Analysis - ${selectedStatOperation}`,
            type: AnalysisType.CLUSTER, // Default, should be mapped based on operation
            data: { type: 'FeatureCollection', features: [] }, // Placeholder
            createdAt: new Date().toISOString(),
            parameters: {
                operation: selectedStatOperation,
                clustering: statisticalOperations.clustering,
                outlierDetection: statisticalOperations.outlierDetection,
                hotspotAnalysis: statisticalOperations.hotspotAnalysis,
                datasets: selectedDatasetIds,
            },
            sourceDatasets: selectedDatasetIds,
        };

        addAnalysisResult(result);
    };

    const handleTemporalAnalysis = () => {
        // Create analysis result and add to context
        const result: AnalysisResult = {
            id: `temporal-${Date.now()}`,
            name: `Temporal Analysis`,
            type: AnalysisType.BUFFER, // Placeholder type
            data: { type: 'FeatureCollection', features: [] }, // Placeholder
            createdAt: new Date().toISOString(),
            parameters: {
                operation: 'temporal-filter',
                timeFilter: temporalOperations.timeFilter,
                animation: temporalOperations.animation,
                timeStep: temporalOperations.timeStep,
                datasets: selectedDatasetIds,
            },
            sourceDatasets: selectedDatasetIds,
        };

        addAnalysisResult(result);
    };

    const handleRemoveResult = (resultId: string) => {
        removeAnalysisResult(resultId);
    };

    const handleClearResults = () => {
        clearAllResults();
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
                        {datasets.map((dataset) => (
                            <div key={dataset.id} className="dataset-item">
                                <input
                                    type="checkbox"
                                    id={`dataset-${dataset.id}`}
                                    checked={selectedDatasetIds.includes(
                                        dataset.id
                                    )}
                                    onChange={() => {
                                        if (
                                            selectedDatasetIds.includes(
                                                dataset.id
                                            )
                                        ) {
                                            setSelectedDatasetIds((prev) =>
                                                prev.filter(
                                                    (id) => id !== dataset.id
                                                )
                                            );
                                        } else {
                                            setSelectedDatasetIds((prev) => [
                                                ...prev,
                                                dataset.id,
                                            ]);
                                        }
                                    }}
                                />
                                <label htmlFor={`dataset-${dataset.id}`}>
                                    {dataset.name} ({dataset.type})
                                </label>
                            </div>
                        ))}
                        {datasets.length === 0 && (
                            <p className="empty-state">
                                No datasets available. Upload or connect to data
                                sources.
                            </p>
                        )}
                    </div>
                </div>

                {/* Analytics Modes */}
                {selectedAnalyticsMode === 'spatial' && (
                    <div className="analytics-mode-section">
                        <h3>Spatial Analysis</h3>
                        <div className="form-group">
                            <label htmlFor="spatial-operation">
                                Operation:
                            </label>
                            <select
                                id="spatial-operation"
                                value={selectedSpatialOperation}
                                onChange={(e) =>
                                    setSelectedSpatialOperation(e.target.value)
                                }
                            >
                                <option value="buffer">Buffer</option>
                                <option value="intersection">
                                    Intersection
                                </option>
                                <option value="union">Union</option>
                                <option value="difference">Difference</option>
                            </select>
                        </div>

                        {selectedSpatialOperation === 'buffer' && (
                            <div className="form-group">
                                <label htmlFor="buffer-distance">
                                    Buffer Distance (m):
                                </label>
                                <input
                                    type="range"
                                    id="buffer-distance"
                                    min="0"
                                    max="5000"
                                    step="10"
                                    value={bufferDistance}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setBufferDistance(value);
                                        setSpatialOperations((prev) => ({
                                            ...prev,
                                            buffer: value,
                                        }));
                                    }}
                                />
                                <span>{bufferDistance}m</span>
                            </div>
                        )}

                        {(selectedSpatialOperation === 'intersection' ||
                            selectedSpatialOperation === 'union' ||
                            selectedSpatialOperation === 'difference') && (
                            <p>
                                Select two or more datasets to perform this
                                operation.
                            </p>
                        )}

                        <button
                            className="apply-btn"
                            disabled={
                                selectedDatasetIds.length === 0 ||
                                isLoading ||
                                analysisLoading
                            }
                            onClick={handleSpatialAnalysis}
                        >
                            {isLoading || analysisLoading
                                ? 'Processing...'
                                : 'Apply Spatial Analysis'}
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
                                onChange={(e) =>
                                    setSelectedStatOperation(e.target.value)
                                }
                            >
                                <option value="clustering">Clustering</option>
                                <option value="outlier">
                                    Outlier Detection
                                </option>
                                <option value="hotspot">
                                    Hotspot Analysis
                                </option>
                            </select>
                        </div>

                        {selectedStatOperation === 'clustering' && (
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={
                                            statisticalOperations.clustering
                                        }
                                        onChange={(e) =>
                                            setStatisticalOperations(
                                                (prev) => ({
                                                    ...prev,
                                                    clustering:
                                                        e.target.checked,
                                                })
                                            )
                                        }
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
                                        checked={
                                            statisticalOperations.outlierDetection
                                        }
                                        onChange={(e) =>
                                            setStatisticalOperations(
                                                (prev) => ({
                                                    ...prev,
                                                    outlierDetection:
                                                        e.target.checked,
                                                })
                                            )
                                        }
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
                                        checked={
                                            statisticalOperations.hotspotAnalysis
                                        }
                                        onChange={(e) =>
                                            setStatisticalOperations(
                                                (prev) => ({
                                                    ...prev,
                                                    hotspotAnalysis:
                                                        e.target.checked,
                                                })
                                            )
                                        }
                                    />
                                    Identify geographic hotspots
                                </label>
                            </div>
                        )}

                        <button
                            className="apply-btn"
                            disabled={
                                selectedDatasetIds.length === 0 ||
                                isLoading ||
                                analysisLoading
                            }
                            onClick={handleStatisticalAnalysis}
                        >
                            {isLoading || analysisLoading
                                ? 'Processing...'
                                : 'Apply Statistical Analysis'}
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
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setTimeRange([value, timeRange[1]]);
                                        setTemporalOperations((prev) => ({
                                            ...prev,
                                            timeFilter: [
                                                value,
                                                timeRange[1],
                                            ] as [number, number],
                                        }));
                                    }}
                                />
                                <input
                                    type="range"
                                    id="time-filter-max"
                                    min="0"
                                    max="100"
                                    value={timeRange[1]}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setTimeRange([timeRange[0], value]);
                                        setTemporalOperations((prev) => ({
                                            ...prev,
                                            timeFilter: [
                                                timeRange[0],
                                                value,
                                            ] as [number, number],
                                        }));
                                    }}
                                />
                            </div>
                            <span>
                                Time Range: {timeRange[0]} - {timeRange[1]}
                            </span>
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={temporalOperations.animation}
                                    onChange={(e) =>
                                        setTemporalOperations((prev) => ({
                                            ...prev,
                                            animation: e.target.checked,
                                        }))
                                    }
                                />
                                Animate Time Series
                            </label>
                        </div>

                        {temporalOperations.animation && (
                            <div className="form-group">
                                <label htmlFor="time-step">
                                    Animation Speed:
                                </label>
                                <input
                                    type="range"
                                    id="time-step"
                                    min="1"
                                    max="10"
                                    value={timeStepValue}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setTimeStepValue(value);
                                        setTemporalOperations((prev) => ({
                                            ...prev,
                                            timeStep: value,
                                        }));
                                    }}
                                />
                                <span>{timeStepValue}x</span>
                            </div>
                        )}

                        <button
                            className="apply-btn"
                            disabled={
                                selectedDatasetIds.length === 0 ||
                                isLoading ||
                                analysisLoading
                            }
                            onClick={handleTemporalAnalysis}
                        >
                            {isLoading || analysisLoading
                                ? 'Processing...'
                                : 'Apply Temporal Analysis'}
                        </button>
                    </div>
                )}

                {/* Analysis Results - now from context */}
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
                        {analysisResults.map((result) => (
                            <div key={result.id} className="result-item">
                                <div className="result-header">
                                    <h4>{result.name}</h4>
                                    <button
                                        className="remove-btn"
                                        onClick={() =>
                                            handleRemoveResult(result.id)
                                        }
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="result-content">
                                    <div className="result-info">
                                        <span className="result-type">
                                            {result.type}
                                        </span>
                                        <span className="result-date">
                                            {new Date(
                                                result.createdAt
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="result-parameters">
                                        {Object.entries(result.parameters).map(
                                            ([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="parameter-item"
                                                >
                                                    <span className="parameter-key">
                                                        {key}:
                                                    </span>
                                                    <span className="parameter-value">
                                                        {typeof value ===
                                                        'object'
                                                            ? JSON.stringify(
                                                                  value
                                                              )
                                                            : String(value)}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {analysisResults.length === 0 && (
                            <p className="empty-state">
                                No analysis results yet. Select datasets and run
                                an analysis.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AnalyticsPanel;
