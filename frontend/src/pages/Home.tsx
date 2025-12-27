import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/types';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import LayerPanel from '../bits/LayerPanel';
import AnalyticsPanel from '../bits/AnalyticsPanel';
import DataManager from '../bits/DataManager';
import VisualizationControls from '../bits/VisualizationControls';
import SpatialAnalysisPanel from '../bits/SpatialAnalysisPanel';
import { fetchLayers, toggleLayerVisibility, updateLayer, deleteLayer } from '../redux/slices/layerSlice';
import { useUI } from '../context/UIContext';
import './Home.css';

const Home: React.FC = () => {
  const dispatch = useDispatch();
  const { isSidebarOpen, activeTab, toggleSidebar } = useUI();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { layers, activeLayers } = useSelector((state: RootState) => state.layers);

  useEffect(() => {
    // Fetch layers when component mounts
    dispatch(fetchLayers());
  }, [dispatch]);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'layers':
        return (
          <LayerPanel
            layers={layers}
            activeLayers={activeLayers}
            onToggleLayer={(layerId) => dispatch(toggleLayerVisibility(layerId))}
            onStyleChange={(layerId, style) => dispatch(updateLayer({ id: layerId, style }))}
            onRemoveLayer={(layerId) => dispatch(deleteLayer(layerId))}
            onLayerOrderChange={(newOrder) => {/* implement layer order change */}}
            onAddLayer={(layer) => {/* implement add layer */}}
          />
        );
      case 'analytics':
        return <AnalyticsPanel />;
      case 'data':
        return <DataManager />;
      case 'visualization':
        return <VisualizationControls />;
      case 'spatial-analysis':
        return <SpatialAnalysisPanel />;
      default:
        return <LayerPanel />;
    }
  };

  return (
    <div className="home">
      <div className={`map-container ${isSidebarOpen ? 'with-sidebar' : ''}`}>
        <Map onLoad={handleMapLoad} />
      </div>

      <Sidebar isOpen={isSidebarOpen} onToggle={() => toggleSidebar()}>
        {renderActivePanel()}
      </Sidebar>
    </div>
  );
};

export default Home; 