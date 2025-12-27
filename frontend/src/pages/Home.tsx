import React, { useEffect, useState } from 'react';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import LayerPanel from '../bits/LayerPanel';
import AnalyticsPanel from '../bits/AnalyticsPanel';
import DataManager from '../bits/DataManager';
import VisualizationControls from '../bits/VisualizationControls';
import SpatialAnalysisPanel from '../bits/SpatialAnalysisPanel';
import { useUI } from '../context/UIContext';
import { useLayerUI } from '../context/LayerUIContext';
import { useLayers, useUpdateLayer, useDeleteLayer } from '../api/queries/layers';

const Home: React.FC = () => {
  const { isSidebarOpen, activeTab, toggleSidebar } = useUI();
  const { activeLayers, toggleLayerVisibility } = useLayerUI();
  const { data: layers = [], refetch: refetchLayers } = useLayers();
  const updateLayerMutation = useUpdateLayer();
  const deleteLayerMutation = useDeleteLayer();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Fetch layers when component mounts
    refetchLayers();
  }, [refetchLayers]);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'layers':
        return (
          <LayerPanel
            layers={layers}
            activeLayers={Array.from(activeLayers)}
            onToggleLayer={(layerId) => toggleLayerVisibility(layerId)}
            onStyleChange={(layerId, style) => updateLayerMutation.mutate({ id: Number(layerId), data: { style } as any })}
            onRemoveLayer={(layerId) => deleteLayerMutation.mutate(Number(layerId))}
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