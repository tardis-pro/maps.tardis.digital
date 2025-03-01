import React from 'react';
import ColorRampSelector from './ColorRampSelector';

interface VisualizationControlsProps {
  colorRamp: string;
  opacity: number;
  radius: number;
  elevationScale: number;
  filterRange: [number, number];
  showTooltip: boolean;
  onColorRampChange: (value: string) => void;
  onOpacityChange: (value: number) => void;
  onRadiusChange: (value: number) => void;
  onElevationScaleChange: (value: number) => void;
  onFilterRangeChange: (value: [number, number]) => void;
  onTooltipToggle: () => void;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  colorRamp,
  opacity,
  radius,
  elevationScale,
  filterRange,
  showTooltip,
  onColorRampChange,
  onOpacityChange,
  onRadiusChange,
  onElevationScaleChange,
  onFilterRangeChange,
  onTooltipToggle
}) => {
  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '15px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        width: '250px'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Visualization Settings</h3>
      
      <ColorRampSelector value={colorRamp} onChange={onColorRampChange} />
      
      <div style={{ marginTop: '10px' }}>
        <label htmlFor="opacity-slider">Opacity: {opacity.toFixed(1)}</label>
        <input 
          id="opacity-slider"
          type="range" 
          min="0" 
          max="1" 
          step="0.1"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label htmlFor="radius-slider">Radius: {radius}px</label>
        <input 
          id="radius-slider"
          type="range" 
          min="10" 
          max="500" 
          step="10"
          value={radius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label htmlFor="elevation-slider">Elevation: {elevationScale.toFixed(1)}</label>
        <input 
          id="elevation-slider"
          type="range" 
          min="0" 
          max="10" 
          step="0.1"
          value={elevationScale}
          onChange={(e) => onElevationScaleChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label>Filter Range: {filterRange[0]}% - {filterRange[1]}%</label>
        <div style={{ display: 'flex', gap: '5px' }}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1"
            value={filterRange[0]}
            onChange={(e) => onFilterRangeChange([parseInt(e.target.value), filterRange[1]])}
            style={{ flex: 1 }}
          />
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1"
            value={filterRange[1]}
            onChange={(e) => onFilterRangeChange([filterRange[0], parseInt(e.target.value)])}
            style={{ flex: 1 }}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={showTooltip}
            onChange={onTooltipToggle}
          /> 
          Show Tooltips
        </label>
      </div>
    </div>
  );
};

export default VisualizationControls;