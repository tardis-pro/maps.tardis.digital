import React, { useState } from 'react';
import { FaChartBar, FaLayerGroup, FaDotCircle, FaRuler } from 'react-icons/fa';
import { ANALYTICS_MODES, AGGREGATION_TYPES } from '../config/config';

interface AnalyticsPanelProps {
  layers: any[];
  visibleLayers: string[];
  selectedAnalyticsMode: string | null;
  aggregationType: string;
  results: any;
  isRunning: boolean;
  onModeChange: (mode: string) => void;
  onAggregationTypeChange: (type: string) => void;
  onPropertySelect: (property: string) => void;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  layers,
  visibleLayers,
  selectedAnalyticsMode,
  aggregationType,
  results,
  isRunning,
  onModeChange,
  onAggregationTypeChange,
  onPropertySelect
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  
  const visibleLayerData = layers.filter(layer => visibleLayers.includes(layer.id));
  const properties = visibleLayerData.length > 0 && visibleLayerData[0].data?.features?.length > 0 
    ? Object.keys(visibleLayerData[0].data.features[0].properties || {}) 
    : [];
  
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const property = e.target.value;
    setSelectedProperty(property);
    onPropertySelect(property);
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        width: '280px',
        transition: 'height 0.3s ease',
        height: expanded ? 'auto' : '40px',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          padding: '10px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: expanded ? '1px solid #ddd' : 'none',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FaChartBar /> Analytics
        </h3>
        <span>{expanded ? '▼' : '▲'}</span>
      </div>
      
      {expanded && (
        <div style={{ padding: '10px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Analysis Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              <button
                onClick={() => onModeChange(ANALYTICS_MODES.SPATIAL_JOIN)}
                style={{ 
                  flex: 1, 
                  padding: '5px', 
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  background: selectedAnalyticsMode === ANALYTICS_MODES.SPATIAL_JOIN ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  minWidth: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaLayerGroup />
                <span style={{ fontSize: '12px' }}>Spatial Join</span>
              </button>
              <button
                onClick={() => onModeChange(ANALYTICS_MODES.CLUSTERING)}
                style={{ 
                  flex: 1, 
                  padding: '5px', 
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  background: selectedAnalyticsMode === ANALYTICS_MODES.CLUSTERING ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  minWidth: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaDotCircle />
                <span style={{ fontSize: '12px' }}>Clustering</span>
              </button>
              <button
                onClick={() => onModeChange(ANALYTICS_MODES.POINT_IN_POLYGON)}
                style={{ 
                  flex: 1, 
                  padding: '5px', 
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  background: selectedAnalyticsMode === ANALYTICS_MODES.POINT_IN_POLYGON ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  minWidth: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaLayerGroup />
                <span style={{ fontSize: '12px' }}>Point in Polygon</span>
              </button>
              <button
                onClick={() => onModeChange(ANALYTICS_MODES.ISOCHRONES)}
                style={{ 
                  flex: 1, 
                  padding: '5px', 
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  background: selectedAnalyticsMode === ANALYTICS_MODES.ISOCHRONES ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  minWidth: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaRuler />
                <span style={{ fontSize: '12px' }}>Isochrones</span>
              </button>
            </div>
          </div>
          
          {selectedAnalyticsMode && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Property</label>
                <select
                  value={selectedProperty}
                  onChange={handlePropertyChange}
                  style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select a property</option>
                  {properties.map(prop => (
                    <option key={prop} value={prop}>{prop}</option>
                  ))}
                </select>
              </div>
              
              {selectedAnalyticsMode === ANALYTICS_MODES.CLUSTERING && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Aggregation Type</label>
                  <select
                    value={aggregationType}
                    onChange={(e) => onAggregationTypeChange(e.target.value)}
                    style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value={AGGREGATION_TYPES.COUNT}>Count</option>
                    <option value={AGGREGATION_TYPES.SUM}>Sum</option>
                    <option value={AGGREGATION_TYPES.AVERAGE}>Average</option>
                    <option value={AGGREGATION_TYPES.MIN}>Min</option>
                    <option value={AGGREGATION_TYPES.MAX}>Max</option>
                  </select>
                </div>
              )}
              
              {/* Results section */}
              {results && Object.keys(results).length > 0 && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Results</h4>
                  <div style={{ fontSize: '12px' }}>
                    {Object.entries(results).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '5px' }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {isRunning && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <p>Analysis in progress...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;