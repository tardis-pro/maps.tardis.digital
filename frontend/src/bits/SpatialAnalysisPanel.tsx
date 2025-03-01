import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/types';
import SpatialAnalysis from '../utils/spatialAnalysis';
import { FeatureCollection } from 'geojson';
import './SpatialAnalysisPanel.css';

// Analysis types supported by the panel
export enum AnalysisType {
  BUFFER = 'buffer',
  INTERSECTION = 'intersection',
  UNION = 'union',
  DIFFERENCE = 'difference',
  POINTS_IN_POLYGON = 'pointsInPolygon',
  CLUSTER = 'cluster',
  ISOCHRONES = 'isochrones',
  HOTSPOT = 'hotspot'
}

// Props for the component
interface SpatialAnalysisPanelProps {
  onAnalysisComplete?: (result: FeatureCollection) => void;
}

const SpatialAnalysisPanel: React.FC<SpatialAnalysisPanelProps> = ({ onAnalysisComplete }) => {
  const dispatch = useDispatch();
  
  // Get datasets from Redux store
  const datasets = useSelector((state: RootState) => state.data.datasets);
  
  // Local state
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>(AnalysisType.BUFFER);
  const [primaryDataset, setPrimaryDataset] = useState<string>('');
  const [secondaryDataset, setSecondaryDataset] = useState<string>('');
  const [bufferRadius, setBufferRadius] = useState<number>(1);
  const [clusterRadius, setClusterRadius] = useState<number>(1);
  const [isochroneMinutes, setIsochroneMinutes] = useState<string>('5,10,15,30');
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [cellSize, setCellSize] = useState<number>(5);
  const [weightProperty, setWeightProperty] = useState<string>('');
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update available properties when primary dataset changes
  useEffect(() => {
    if (primaryDataset && datasets[primaryDataset]?.data) {
      const dataset = datasets[primaryDataset].data;
      if (dataset && dataset.features && dataset.features.length > 0) {
        const feature = dataset.features[0];
        if (feature.properties) {
          setAvailableProperties(Object.keys(feature.properties));
        }
      }
    }
  }, [primaryDataset, datasets]);
  
  // Determine if the analysis requires a secondary dataset
  const needsSecondaryDataset = () => {
    return [
      AnalysisType.INTERSECTION,
      AnalysisType.DIFFERENCE,
      AnalysisType.POINTS_IN_POLYGON
    ].includes(selectedAnalysis);
  };
  
  // Run the analysis
  const runAnalysis = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!primaryDataset || !datasets[primaryDataset]?.data) {
        throw new Error('Primary dataset is required');
      }
      
      const primaryData = datasets[primaryDataset].data;
      
      if (needsSecondaryDataset() && (!secondaryDataset || !datasets[secondaryDataset]?.data)) {
        throw new Error('Secondary dataset is required for this analysis');
      }
      
      let result: FeatureCollection;
      
      switch (selectedAnalysis) {
        case AnalysisType.BUFFER:
          result = SpatialAnalysis.buffer(primaryData, bufferRadius);
          break;
          
        case AnalysisType.INTERSECTION:
          result = SpatialAnalysis.intersection(
            primaryData,
            datasets[secondaryDataset].data
          );
          break;
          
        case AnalysisType.UNION:
          result = SpatialAnalysis.union(primaryData);
          break;
          
        case AnalysisType.DIFFERENCE:
          result = SpatialAnalysis.difference(
            primaryData,
            datasets[secondaryDataset].data
          );
          break;
          
        case AnalysisType.POINTS_IN_POLYGON:
          result = SpatialAnalysis.pointsInPolygon(
            primaryData,
            datasets[secondaryDataset].data
          );
          break;
          
        case AnalysisType.CLUSTER:
          result = SpatialAnalysis.cluster(primaryData, {
            radius: clusterRadius
          });
          break;
          
        case AnalysisType.ISOCHRONES:
          result = SpatialAnalysis.isochrones(primaryData, {
            minutes: isochroneMinutes.split(',').map(m => parseInt(m.trim(), 10)),
            mode: travelMode
          });
          break;
          
        case AnalysisType.HOTSPOT:
          result = SpatialAnalysis.hotspotAnalysis(primaryData, {
            cellSize,
            property: weightProperty || undefined
          });
          break;
          
        default:
          throw new Error('Unknown analysis type');
      }
      
      setAnalysisResult(result);
      
      // Call the callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the count of features in the result
  const getResultCount = () => {
    return analysisResult?.features?.length || 0;
  };
  
  return (
    <div className="spatial-analysis-panel">
      <h2>Spatial Analysis</h2>
      
      <div className="analysis-form">
        <div className="form-group">
          <label htmlFor="analysis-type">Analysis Type</label>
          <select
            id="analysis-type"
            value={selectedAnalysis}
            onChange={(e) => setSelectedAnalysis(e.target.value as AnalysisType)}
          >
            <option value={AnalysisType.BUFFER}>Buffer</option>
            <option value={AnalysisType.INTERSECTION}>Intersection</option>
            <option value={AnalysisType.UNION}>Union</option>
            <option value={AnalysisType.DIFFERENCE}>Difference</option>
            <option value={AnalysisType.POINTS_IN_POLYGON}>Points in Polygon</option>
            <option value={AnalysisType.CLUSTER}>Cluster</option>
            <option value={AnalysisType.ISOCHRONES}>Isochrones</option>
            <option value={AnalysisType.HOTSPOT}>Hotspot Analysis</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="primary-dataset">Primary Dataset</label>
          <select
            id="primary-dataset"
            value={primaryDataset}
            onChange={(e) => setPrimaryDataset(e.target.value)}
          >
            <option value="">Select a dataset</option>
            {Object.keys(datasets).map(key => (
              <option key={key} value={key}>{datasets[key].name}</option>
            ))}
          </select>
        </div>
        
        {needsSecondaryDataset() && (
          <div className="form-group">
            <label htmlFor="secondary-dataset">Secondary Dataset</label>
            <select
              id="secondary-dataset"
              value={secondaryDataset}
              onChange={(e) => setSecondaryDataset(e.target.value)}
            >
              <option value="">Select a dataset</option>
              {Object.keys(datasets).map(key => (
                <option key={key} value={key}>{datasets[key].name}</option>
              ))}
            </select>
          </div>
        )}
        
        {selectedAnalysis === AnalysisType.BUFFER && (
          <div className="form-group">
            <label htmlFor="buffer-radius">Buffer Radius (km)</label>
            <input
              id="buffer-radius"
              type="number"
              min="0.1"
              step="0.1"
              value={bufferRadius}
              onChange={(e) => setBufferRadius(parseFloat(e.target.value))}
            />
          </div>
        )}
        
        {selectedAnalysis === AnalysisType.CLUSTER && (
          <div className="form-group">
            <label htmlFor="cluster-radius">Cluster Radius (km)</label>
            <input
              id="cluster-radius"
              type="number"
              min="0.1"
              step="0.1"
              value={clusterRadius}
              onChange={(e) => setClusterRadius(parseFloat(e.target.value))}
            />
          </div>
        )}
        
        {selectedAnalysis === AnalysisType.ISOCHRONES && (
          <>
            <div className="form-group">
              <label htmlFor="isochrone-minutes">Isochrone Minutes (comma-separated)</label>
              <input
                id="isochrone-minutes"
                type="text"
                value={isochroneMinutes}
                onChange={(e) => setIsochroneMinutes(e.target.value)}
                placeholder="5,10,15,30"
              />
            </div>
            <div className="form-group">
              <label htmlFor="travel-mode">Travel Mode</label>
              <select
                id="travel-mode"
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as 'driving' | 'walking' | 'cycling')}
              >
                <option value="driving">Driving</option>
                <option value="walking">Walking</option>
                <option value="cycling">Cycling</option>
              </select>
            </div>
          </>
        )}
        
        {selectedAnalysis === AnalysisType.HOTSPOT && (
          <>
            <div className="form-group">
              <label htmlFor="cell-size">Cell Size (km)</label>
              <input
                id="cell-size"
                type="number"
                min="0.1"
                step="0.1"
                value={cellSize}
                onChange={(e) => setCellSize(parseFloat(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="weight-property">Weight Property (optional)</label>
              <select
                id="weight-property"
                value={weightProperty}
                onChange={(e) => setWeightProperty(e.target.value)}
              >
                <option value="">None</option>
                {availableProperties.map(prop => (
                  <option key={prop} value={prop}>{prop}</option>
                ))}
              </select>
            </div>
          </>
        )}
        
        <button 
          className="run-analysis-btn"
          onClick={runAnalysis}
          disabled={isLoading || !primaryDataset || (needsSecondaryDataset() && !secondaryDataset)}
        >
          {isLoading ? 'Running...' : 'Run Analysis'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {analysisResult && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          <p>Generated {getResultCount()} features</p>
          
          <div className="result-actions">
            <button 
              className="add-to-map-btn"
              onClick={() => {
                // Here you would dispatch an action to add the result to the map
                // This would be implemented in your Redux layer
                if (analysisResult) {
                  // Example: dispatch(addLayerFromAnalysis(analysisResult));
                  alert('Add to map functionality would be implemented here');
                }
              }}
            >
              Add to Map
            </button>
            
            <button
              className="export-btn"
              onClick={() => {
                if (analysisResult) {
                  const dataStr = JSON.stringify(analysisResult);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  
                  const exportFileDefaultName = 'analysis-result.geojson';
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }
              }}
            >
              Export GeoJSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialAnalysisPanel; 