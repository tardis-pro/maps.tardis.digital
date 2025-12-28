import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayerList, { Layer } from './LayerList';
import AnalysisTools from './AnalysisTools';

type SidebarSection = 'layers' | 'analysis';

interface SidebarProps {
  isOpen: boolean;
  layers: Layer[];
  onToggleLayerVisibility: (layerId: string | number) => void;
  onLayerSelect: (layerId: string | number) => void;
  onAddLayer: () => void;
  onAnalysisTool: (toolId: string) => void;
  selectedLayerId?: string | number | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  layers,
  onToggleLayerVisibility,
  onLayerSelect,
  onAddLayer,
  onAnalysisTool,
  selectedLayerId,
}) => {
  const [activeSection, setActiveSection] = useState<SidebarSection>('layers');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 'var(--topbar-height)',
            left: 0,
            bottom: 0,
            width: 'var(--sidebar-width)',
            backgroundColor: 'var(--color-bg-primary)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Section tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <button
              onClick={() => setActiveSection('layers')}
              style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom:
                  activeSection === 'layers'
                    ? '2px solid var(--color-accent)'
                    : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color:
                  activeSection === 'layers'
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Layers
            </button>
            <button
              onClick={() => setActiveSection('analysis')}
              style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom:
                  activeSection === 'analysis'
                    ? '2px solid var(--color-accent)'
                    : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color:
                  activeSection === 'analysis'
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Analysis
            </button>
          </div>

          {/* Section content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeSection === 'layers' ? (
              <LayerList
                layers={layers}
                onToggleVisibility={onToggleLayerVisibility}
                onLayerSelect={onLayerSelect}
                onAddLayer={onAddLayer}
                selectedLayerId={selectedLayerId}
              />
            ) : (
              <AnalysisTools onToolSelect={onAnalysisTool} />
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
