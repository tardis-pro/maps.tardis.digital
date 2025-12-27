import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../redux/types';
import {
  useVisualization,
  ColorRamp,
  AggregationType,
  COLOR_RAMPS
} from '../context/VisualizationContext';
import '../effects/VisualizationControls.css';

interface VisualizationControlsProps {
  onClose?: () => void;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({ onClose }) => {
  const {
    visualizationSettings,
    updateVisualizationSettings
  } = useVisualization();

  // Still get datasets from Redux for now (data management stays in Redux)
  const { datasets, selectedDatasetIds } = useSelector((state: RootState) => state.analytics);

  const selectedDatasets = datasets.filter(d => selectedDatasetIds.includes(d.id));
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

  // Local state for form values
  const [selectedProperty, setSelectedProperty] = useState('');
  const [colorRamp, setColorRamp] = useState<ColorRamp>('viridis');
  const [opacity, setOpacity] = useState(0.8);
  const [radius, setRadius] = useState(10);
  const [filterRange, setFilterRange] = useState<[number, number]>([0, 100]);
  const [aggregation, setAggregation] = useState<AggregationType>('none');
  const [aggregationResolution, setAggregationResolution] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  // Set the first selected dataset as active when component mounts or selection changes
  useEffect(() => {
    if (selectedDatasetIds.length > 0) {
      const firstId = selectedDatasetIds[0];
      setActiveDatasetId(firstId);

      // Load existing settings if available
      if (visualizationSettings[firstId]) {
        const settings = visualizationSettings[firstId];
        setSelectedProperty(settings.property);
        setColorRamp(settings.colorRamp);
        setOpacity(settings.opacity);
        setRadius(settings.radius);
        setFilterRange(settings.filterRange);
        setAggregation(settings.aggregation);
        setAggregationResolution(settings.aggregationResolution);
        setShowLegend(settings.showLegend);
      }
    } else {
      setActiveDatasetId(null);
    }
  }, [selectedDatasetIds, visualizationSettings]);

  // Get available properties from active dataset
  const availableProperties = React.useMemo(() => {
    if (!activeDatasetId) return [];

    const dataset = datasets.find(d => d.id === activeDatasetId);
    if (!dataset) return [];

    return Object.entries(dataset.properties)
      .filter(([_, prop]) => ['number', 'string'].includes(prop.type))
      .map(([key]) => key);
  }, [activeDatasetId, datasets]);

  // Handle dataset change
  const handleDatasetChange = (id: string) => {
    setActiveDatasetId(id);

    // Load settings for this dataset if available
    if (visualizationSettings[id]) {
      const settings = visualizationSettings[id];
      setSelectedProperty(settings.property);
      setColorRamp(settings.colorRamp);
      setOpacity(settings.opacity);
      setRadius(settings.radius);
      setFilterRange(settings.filterRange);
      setAggregation(settings.aggregation);
      setAggregationResolution(settings.aggregationResolution);
      setShowLegend(settings.showLegend);
    } else {
      // Reset to default values
      setSelectedProperty(availableProperties[0] || '');
      setColorRamp('viridis');
      setOpacity(0.8);
      setRadius(10);
      setFilterRange([0, 100]);
      setAggregation('none');
      setAggregationResolution(1);
      setShowLegend(true);
    }
  };

  // Apply visualization settings using context
  const applyVisualization = () => {
    if (!activeDatasetId || !selectedProperty) return;

    updateVisualizationSettings({
      datasetId: activeDatasetId,
      property: selectedProperty,
      colorRamp,
      opacity,
      radius,
      filterRange,
      aggregation,
      aggregationResolution,
      showLegend
    });
  };

  // Generate a legend scale based on the current color ramp
  const renderColorScale = () => {
    const colors = COLOR_RAMPS[colorRamp as keyof typeof COLOR_RAMPS];

    return (
      <div className="color-scale">
        <div
          className="gradient"
          style={{
            background: `linear-gradient(to right, ${colors.join(', ')})`,
            opacity
          }}
        />
        <div className="scale-labels">
          <span>{filterRange[0]}%</span>
          <span>{filterRange[1]}%</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="visualization-controls"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="controls-header">
        <h2>Visualization</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        )}
      </div>

      <div className="controls-content">
        {selectedDatasets.length === 0 ? (
          <p className="empty-state">
            Please select one or more datasets to visualize.
          </p>
        ) : (
          <>
            {/* Dataset Selector */}
            {selectedDatasets.length > 1 && (
              <div className="control-group">
                <label htmlFor="dataset-select">Active Dataset</label>
                <select
                  id="dataset-select"
                  value={activeDatasetId || ''}
                  onChange={e => handleDatasetChange(e.target.value)}
                >
                  {selectedDatasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Property Selection */}
            <div className="control-group">
              <label htmlFor="property-select">Data Property</label>
              <select
                id="property-select"
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                disabled={!activeDatasetId || availableProperties.length === 0}
              >
                {availableProperties.length === 0 ? (
                  <option value="">No numeric properties available</option>
                ) : (
                  availableProperties.map(prop => (
                    <option key={prop} value={prop}>{prop}</option>
                  ))
                )}
              </select>
            </div>

            {/* Color Ramp Selection */}
            <div className="control-group">
              <label>Color Scheme</label>
              <div className="color-ramp-selector">
                {Object.keys(COLOR_RAMPS).map(name => (
                  <button
                    key={name}
                    className={`color-ramp-option ${colorRamp === name ? 'active' : ''}`}
                    onClick={() => setColorRamp(name as ColorRamp)}
                    style={{
                      background: `linear-gradient(to right, ${COLOR_RAMPS[name as ColorRamp].join(', ')})`
                    }}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Value Filter Range */}
            <div className="control-group">
              <label>
                Filter Range <span className="range-value">{filterRange[0]}% - {filterRange[1]}%</span>
              </label>
              <div className="range-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterRange[0]}
                  onChange={e => setFilterRange([parseInt(e.target.value), filterRange[1]])}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterRange[1]}
                  onChange={e => setFilterRange([filterRange[0], parseInt(e.target.value)])}
                />
              </div>
            </div>

            {/* Opacity Control */}
            <div className="control-group">
              <label>
                Opacity <span className="range-value">{Math.round(opacity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
              />
            </div>

            {/* Point Radius (for point data) */}
            <div className="control-group">
              <label>
                Point Radius <span className="range-value">{radius}px</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={e => setRadius(parseInt(e.target.value))}
              />
            </div>

            {/* Aggregation Options */}
            <div className="control-group">
              <label htmlFor="aggregation-select">Aggregation</label>
              <select
                id="aggregation-select"
                value={aggregation}
                onChange={e => setAggregation(e.target.value as AggregationType)}
              >
                <option value="none">None</option>
                <option value="grid">Grid</option>
                <option value="hexbin">Hexbin</option>
                <option value="cluster">Cluster</option>
                <option value="heatmap">Heatmap</option>
              </select>
            </div>

            {/* Aggregation Resolution (if aggregation is enabled) */}
            {aggregation !== 'none' && (
              <div className="control-group">
                <label>
                  Resolution <span className="range-value">{aggregationResolution}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={aggregationResolution}
                  onChange={e => setAggregationResolution(parseInt(e.target.value))}
                />
              </div>
            )}

            {/* Legend Toggle */}
            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={e => setShowLegend(e.target.checked)}
                />
                Show Legend
              </label>
            </div>

            {/* Legend Preview */}
            {showLegend && (
              <div className="legend-preview">
                <h3>Legend Preview</h3>
                <div className="legend-property">{selectedProperty || 'No property selected'}</div>
                {renderColorScale()}
              </div>
            )}

            {/* Apply Button */}
            <button
              className="apply-btn"
              onClick={applyVisualization}
              disabled={!activeDatasetId || !selectedProperty}
            >
              Apply Visualization
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default VisualizationControls;
