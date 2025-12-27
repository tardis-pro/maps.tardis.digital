import React from 'react';
import { useUI } from '../context/UIContext';
import './Sidebar.css';

// Icons
import { FaLayerGroup, FaChartBar, FaDatabase, FaPalette, FaMapMarkedAlt } from 'react-icons/fa';

type PanelType = 'layers' | 'analytics' | 'data' | 'visualization' | 'spatial-analysis';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, children }) => {
  const { activeTab, setActiveTab } = useUI();

  const handlePanelChange = (panel: PanelType) => {
    setActiveTab(panel);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? '◀' : '▶'}
      </div>
      
      <div className="sidebar-tabs">
        <div 
          className={`sidebar-tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => handlePanelChange('layers')}
          title="Layers"
        >
          <FaLayerGroup />
        </div>
        <div 
          className={`sidebar-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handlePanelChange('analytics')}
          title="Analytics"
        >
          <FaChartBar />
        </div>
        <div 
          className={`sidebar-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => handlePanelChange('data')}
          title="Data"
        >
          <FaDatabase />
        </div>
        <div 
          className={`sidebar-tab ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => handlePanelChange('visualization')}
          title="Visualization"
        >
          <FaPalette />
        </div>
        <div 
          className={`sidebar-tab ${activeTab === 'spatial-analysis' ? 'active' : ''}`}
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