import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/types';
import { setActivePanel, PanelType } from '../redux/slices/uiSlice';
import './Sidebar.css';

// Icons
import { FaLayerGroup, FaChartBar, FaDatabase, FaPalette, FaMapMarkedAlt } from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, children }) => {
  const dispatch = useDispatch();
  const activePanel = useSelector((state: RootState) => state.ui.activePanel);

  const handlePanelChange = (panel: PanelType) => {
    dispatch(setActivePanel(panel));
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? '◀' : '▶'}
      </div>
      
      <div className="sidebar-tabs">
        <div 
          className={`sidebar-tab ${activePanel === 'layers' ? 'active' : ''}`}
          onClick={() => handlePanelChange('layers')}
          title="Layers"
        >
          <FaLayerGroup />
        </div>
        <div 
          className={`sidebar-tab ${activePanel === 'analytics' ? 'active' : ''}`}
          onClick={() => handlePanelChange('analytics')}
          title="Analytics"
        >
          <FaChartBar />
        </div>
        <div 
          className={`sidebar-tab ${activePanel === 'data' ? 'active' : ''}`}
          onClick={() => handlePanelChange('data')}
          title="Data"
        >
          <FaDatabase />
        </div>
        <div 
          className={`sidebar-tab ${activePanel === 'visualization' ? 'active' : ''}`}
          onClick={() => handlePanelChange('visualization')}
          title="Visualization"
        >
          <FaPalette />
        </div>
        <div 
          className={`sidebar-tab ${activePanel === 'spatial-analysis' ? 'active' : ''}`}
          onClick={() => handlePanelChange('spatial-analysis')}
          title="Spatial Analysis"
        >
          <FaMapMarkedAlt />
        </div>
      </div>
      
      <div className="sidebar-content">
        {children}
      </div>
    </div>
  );
};

export default Sidebar; 