import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaTrash, FaCog, FaPlus } from 'react-icons/fa';

interface Layer {
  id: string;
  name: string;
  type: string;
  url?: string;
  data?: any;
  style?: any;
}

interface LayerPanelProps {
  layers: Layer[];
  visibleLayers: string[];
  onToggleLayer: (layerId: string, checked: boolean) => void;
  onStyleChange: (layerId: string, property: string, value: any) => void;
  onAddLayer: (layer: any) => void;
  onRemoveLayer: (layerId: string) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  visibleLayers,
  onToggleLayer,
  onStyleChange,
  onAddLayer,
  onRemoveLayer
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [newLayerType, setNewLayerType] = useState('mvt');
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerUrl, setNewLayerUrl] = useState('');

  const handleLayerToggle = (layerId: string) => {
    const isVisible = visibleLayers.includes(layerId);
    onToggleLayer(layerId, !isVisible);
  };

  const handleLayerExpand = (layerId: string) => {
    setExpanded(expanded === layerId ? null : layerId);
  };

  const handleAddLayer = () => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: newLayerName || `New Layer ${layers.length + 1}`,
      type: newLayerType,
      url: newLayerUrl,
      style: {
        fillColor: [255, 140, 0, 200],
        lineColor: [0, 0, 0, 255],
        lineWidth: 1,
        opacity: 0.8
      }
    };
    
    onAddLayer(newLayer);
    setShowAddLayerModal(false);
    setNewLayerName('');
    setNewLayerUrl('');
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '10px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        width: '280px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Layers</h3>
        <button
          onClick={() => setShowAddLayerModal(true)}
          style={{ 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FaPlus size={12} /> Add Layer
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {layers.map(layer => (
          <div 
            key={layer.id} 
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              overflow: 'hidden'
            }}
          >
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px',
                backgroundColor: visibleLayers.includes(layer.id) ? '#f0f9ff' : 'white',
                cursor: 'pointer'
              }}
              onClick={() => handleLayerExpand(layer.id)}
            >
              <div style={{ fontWeight: 'bold', flex: 1 }}>{layer.name}</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLayerToggle(layer.id);
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: visibleLayers.includes(layer.id) ? '#4CAF50' : '#aaa'
                  }}
                >
                  {visibleLayers.includes(layer.id) ? <FaEye /> : <FaEyeSlash />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLayer(layer.id);
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: '#ff5252'
                  }}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            {expanded === layer.id && (
              <div style={{ padding: '8px', borderTop: '1px solid #ddd' }}>
                <div style={{ marginBottom: '8px' }}>
                  <small style={{ color: '#666' }}>Type: {layer.type}</small>
                </div>
                
                {layer.type === 'mvt' && layer.url && (
                  <div style={{ marginBottom: '8px' }}>
                    <small style={{ color: '#666' }}>URL: {layer.url.substring(0, 30)}...</small>
                  </div>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.style?.opacity || 0.8}
                    onChange={(e) => onStyleChange(layer.id, 'opacity', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Line Width</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={layer.style?.lineWidth || 1}
                    onChange={(e) => onStyleChange(layer.id, 'lineWidth', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                {(layer.type === 'hexagon' || layer.type === 'geojson') && (
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={layer.style?.extruded || false}
                        onChange={(e) => onStyleChange(layer.id, 'extruded', e.target.checked)}
                        style={{ marginRight: '4px' }}
                      />
                      3D Extrusion
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {layers.length === 0 && (
          <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
            No layers available. Add a layer to get started.
          </div>
        )}
      </div>

      {/* Add Layer Modal */}
      {showAddLayerModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '4px',
              padding: '20px',
              width: '400px',
              maxWidth: '90%'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add New Layer</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Layer Name</label>
              <input
                type="text"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="Enter layer name"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Layer Type</label>
              <select
                value={newLayerType}
                onChange={(e) => setNewLayerType(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="mvt">MVT Tile</option>
                <option value="geojson">GeoJSON</option>
                <option value="heatmap">Heatmap</option>
                <option value="hexagon">Hexagon</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>URL / Source</label>
              <input
                type="text"
                value={newLayerUrl}
                onChange={(e) => setNewLayerUrl(e.target.value)}
                placeholder="Enter MVT URL or data source"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowAddLayerModal(false)}
                style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddLayer}
                style={{ 
                  padding: '8px 15px', 
                  borderRadius: '4px', 
                  border: 'none', 
                  background: '#4CAF50', 
                  color: 'white', 
                  cursor: 'pointer'
                }}
              >
                Add Layer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;