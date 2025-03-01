import React from 'react';
import { FaLayerGroup, FaDownload, FaRuler, FaShareAlt, FaMapMarkedAlt } from 'react-icons/fa';

interface MapControlsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onBasemapChange: (style: string) => void;
  onExportMap: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  position = 'top-right',
  onBasemapChange,
  onExportMap
}) => {
  const positionStyles = {
    'top-right': { top: '10px', right: '10px' },
    'top-left': { top: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '5px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <button 
        onClick={() => onBasemapChange('streets')}
        title="Streets Basemap"
        style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <FaMapMarkedAlt />
      </button>
      <button 
        onClick={() => onBasemapChange('satellite')}
        title="Satellite Basemap"
        style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <FaLayerGroup />
      </button>
      <button 
        onClick={onExportMap}
        title="Export Map"
        style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <FaDownload />
      </button>
      <button 
        title="Measure Distance"
        style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <FaRuler />
      </button>
      <button 
        title="Share Map"
        style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <FaShareAlt />
      </button>
    </div>
  );
};

export default MapControls;