# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the map application from cluttered overlapping panels to a clean, professional layout with left sidebar + bottom drawer.

**Architecture:** Replace current sidebar/panel system with three main components: TopBar (minimal header), Sidebar (layers + analysis, fully hideable), and BottomDrawer (data table, collapsible). Data import moves to modal.

**Tech Stack:** React 19, Mantine UI, Tailwind CSS, Framer Motion

---

## Task 1: Add CSS Design Tokens

**Files:**
- Create: `frontend/src/styles/variables.css`
- Modify: `frontend/src/index.css`

**Step 1: Create variables.css with design tokens**

```css
:root {
  /* Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f7fa;
  --color-bg-tertiary: #edf2f7;
  --color-border: #e2e8f0;
  --color-border-light: #f0f4f8;
  --color-text-primary: #1a202c;
  --color-text-secondary: #718096;
  --color-text-muted: #a0aec0;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-light: #ebf5ff;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  /* Sizing */
  --topbar-height: 48px;
  --sidebar-width: 280px;
  --drawer-collapsed: 40px;
  --drawer-expanded: 300px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.15);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

**Step 2: Update index.css to import variables**

Add at the top of `frontend/src/index.css`:
```css
@import './styles/variables.css';
```

**Step 3: Verify import works**

Run: `pnpm run build --filter=frontend 2>&1 | head -20`
Expected: Build succeeds or only shows pre-existing errors

**Step 4: Commit**

```bash
git add frontend/src/styles/variables.css frontend/src/index.css
git commit -m "feat(ui): add CSS design tokens for redesign"
```

---

## Task 2: Create TopBar Component

**Files:**
- Create: `frontend/src/components/TopBar.tsx`

**Step 1: Create TopBar component**

```tsx
import React from 'react';
import { FaBars, FaCog, FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-lg)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <button
          onClick={onMenuClick}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}
          className="hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          <FaBars size={18} />
        </button>
        <span
          style={{
            fontWeight: 600,
            fontSize: '16px',
            color: 'var(--color-text-primary)',
          }}
        >
          Tardis Maps
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)',
          }}
          className="hover:bg-gray-100"
          aria-label="Help"
        >
          <FaQuestionCircle size={16} />
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)',
          }}
          className="hover:bg-gray-100"
          aria-label="Settings"
        >
          <FaCog size={16} />
        </button>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            marginLeft: 'var(--spacing-sm)',
            cursor: 'pointer',
          }}
        >
          {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'G'}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
```

**Step 2: Verify component compiles**

Run: `pnpm run type-check --filter=frontend 2>&1 | grep -E "(TopBar|error)" | head -10`
Expected: No errors related to TopBar.tsx

**Step 3: Commit**

```bash
git add frontend/src/components/TopBar.tsx
git commit -m "feat(ui): add TopBar component"
```

---

## Task 3: Create New Sidebar Component

**Files:**
- Create: `frontend/src/components/sidebar/index.tsx`
- Create: `frontend/src/components/sidebar/LayerList.tsx`
- Create: `frontend/src/components/sidebar/AnalysisTools.tsx`

**Step 1: Create LayerList component**

```tsx
// frontend/src/components/sidebar/LayerList.tsx
import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaEllipsisV, FaSearch } from 'react-icons/fa';

export interface Layer {
  id: string | number;
  name: string;
  visible: boolean;
  type?: string;
}

interface LayerListProps {
  layers: Layer[];
  onToggleVisibility: (layerId: string | number) => void;
  onLayerSelect: (layerId: string | number) => void;
  onAddLayer: () => void;
  selectedLayerId?: string | number | null;
}

const LayerList: React.FC<LayerListProps> = ({
  layers,
  onToggleVisibility,
  onLayerSelect,
  onAddLayer,
  selectedLayerId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLayers = layers.filter((layer) =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            gap: 'var(--spacing-sm)',
          }}
        >
          <FaSearch size={12} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '13px',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredLayers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => onLayerSelect(layer.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              cursor: 'pointer',
              backgroundColor:
                selectedLayerId === layer.id ? 'var(--color-accent-light)' : 'transparent',
              borderLeft:
                selectedLayerId === layer.id
                  ? '3px solid var(--color-accent)'
                  : '3px solid transparent',
            }}
            className="hover:bg-gray-50"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 'var(--spacing-xs)',
                cursor: 'pointer',
                color: layer.visible ? 'var(--color-accent)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {layer.visible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
            </button>
            <span
              style={{
                flex: 1,
                marginLeft: 'var(--spacing-sm)',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {layer.name}
            </span>
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'none',
                border: 'none',
                padding: 'var(--spacing-xs)',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              className="hover:text-gray-600"
            >
              <FaEllipsisV size={12} />
            </button>
          </div>
        ))}
        {filteredLayers.length === 0 && (
          <div
            style={{
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            {searchQuery ? 'No layers match your search' : 'No layers added yet'}
          </div>
        )}
      </div>

      {/* Add layer button */}
      <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={onAddLayer}
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
          className="hover:opacity-90"
        >
          + Add Layer
        </button>
      </div>
    </div>
  );
};

export default LayerList;
```

**Step 2: Create AnalysisTools component**

```tsx
// frontend/src/components/sidebar/AnalysisTools.tsx
import React from 'react';
import { FaDrawPolygon, FaRuler, FaObjectGroup } from 'react-icons/fa';

interface AnalysisTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const tools: AnalysisTool[] = [
  { id: 'buffer', name: 'Buffer', icon: <FaDrawPolygon />, description: 'Create buffer zones' },
  { id: 'intersect', name: 'Intersect', icon: <FaObjectGroup />, description: 'Find overlaps' },
  { id: 'measure', name: 'Measure', icon: <FaRuler />, description: 'Measure distances' },
];

interface AnalysisToolsProps {
  onToolSelect: (toolId: string) => void;
}

const AnalysisTools: React.FC<AnalysisToolsProps> = ({ onToolSelect }) => {
  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            width: '100%',
            padding: 'var(--spacing-md)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            marginBottom: 'var(--spacing-sm)',
            textAlign: 'left',
          }}
          className="hover:bg-gray-50"
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>{tool.icon}</span>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {tool.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {tool.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AnalysisTools;
```

**Step 3: Create main Sidebar component**

```tsx
// frontend/src/components/sidebar/index.tsx
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
```

**Step 4: Verify components compile**

Run: `pnpm run type-check --filter=frontend 2>&1 | grep -E "(sidebar|error)" | head -10`
Expected: No errors related to sidebar components

**Step 5: Commit**

```bash
git add frontend/src/components/sidebar/
git commit -m "feat(ui): add new Sidebar with LayerList and AnalysisTools"
```

---

## Task 4: Create BottomDrawer Component

**Files:**
- Create: `frontend/src/components/BottomDrawer.tsx`

**Step 1: Create BottomDrawer component**

```tsx
// frontend/src/components/BottomDrawer.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface BottomDrawerProps {
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  columns: Column[];
  data: Record<string, any>[];
  featureCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isExpanded,
  onToggle,
  title,
  subtitle,
  columns,
  data,
  featureCount,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <motion.div
      initial={false}
      animate={{
        height: isExpanded ? 'var(--drawer-expanded)' : 'var(--drawer-collapsed)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-bg-primary)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header - always visible */}
      <div
        onClick={onToggle}
        style={{
          height: 'var(--drawer-collapsed)',
          minHeight: 'var(--drawer-collapsed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--spacing-lg)',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
        }}
        className="hover:bg-gray-50"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
          {isExpanded ? (
            <FaChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
          ) : (
            <FaChevronUp size={12} style={{ color: 'var(--color-text-muted)' }} />
          )}
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {title} ({featureCount.toLocaleString()})
          </span>
          {subtitle && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{subtitle}</span>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {isExpanded ? 'Click to minimize' : 'Click to expand'}
        </span>
      </div>

      {/* Table content - only when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        style={{
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                          borderBottom: '1px solid var(--color-border)',
                          whiteSpace: 'nowrap',
                          width: col.width,
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-bg-secondary)',
                      }}
                      className="hover:bg-blue-50"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            color: 'var(--color-text-primary)',
                            borderBottom: '1px solid var(--color-border-light)',
                          }}
                        >
                          {row[col.key] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <div
                  style={{
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No data to display. Select a layer to view its features.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderTop: '1px solid var(--color-border)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>
                  Showing {(currentPage - 1) * 50 + 1}-{Math.min(currentPage * 50, featureCount)} of{' '}
                  {featureCount.toLocaleString()}
                </span>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BottomDrawer;
```

**Step 2: Verify component compiles**

Run: `pnpm run type-check --filter=frontend 2>&1 | grep -E "(BottomDrawer|error)" | head -10`
Expected: No errors related to BottomDrawer.tsx

**Step 3: Commit**

```bash
git add frontend/src/components/BottomDrawer.tsx
git commit -m "feat(ui): add BottomDrawer component for data table"
```

---

## Task 5: Create AddLayerModal Component

**Files:**
- Create: `frontend/src/components/AddLayerModal.tsx`

**Step 1: Create AddLayerModal component**

```tsx
// frontend/src/components/AddLayerModal.tsx
import React, { useState, useRef } from 'react';
import { Modal, Tabs } from '@mantine/core';
import { FaUpload, FaLink, FaDatabase } from 'react-icons/fa';

interface AddLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (files: File[]) => void;
  onApiConnect: (url: string) => void;
}

const AddLayerModal: React.FC<AddLayerModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onApiConnect,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onFileUpload(Array.from(e.dataTransfer.files));
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileUpload(Array.from(e.target.files));
      onClose();
    }
  };

  const handleApiSubmit = () => {
    if (apiUrl.trim()) {
      onApiConnect(apiUrl.trim());
      setApiUrl('');
      onClose();
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Add Layer"
      size="md"
      styles={{
        title: { fontWeight: 600, fontSize: '18px' },
        body: { padding: 0 },
      }}
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="upload" leftSection={<FaUpload size={14} />}>
            Upload
          </Tabs.Tab>
          <Tabs.Tab value="api" leftSection={<FaLink size={14} />}>
            API
          </Tabs.Tab>
          <Tabs.Tab value="database" leftSection={<FaDatabase size={14} />}>
            Database
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upload" p="md">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FaUpload
              size={32}
              style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}
            />
            <p style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-xs)' }}>
              Drop files here or click to browse
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
              GeoJSON, CSV, TIF, PNG supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".geojson,.json,.csv,.tif,.tiff,.png,.jpg"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="api" p="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <label style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              API Endpoint URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/api/data.geojson"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              style={{
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleApiSubmit}
              disabled={!apiUrl.trim()}
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: apiUrl.trim() ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                color: apiUrl.trim() ? 'white' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: apiUrl.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
            >
              Connect
            </button>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="database" p="md">
          <div
            style={{
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <FaDatabase size={32} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
            <p>Database connections coming soon</p>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

export default AddLayerModal;
```

**Step 2: Verify component compiles**

Run: `pnpm run type-check --filter=frontend 2>&1 | grep -E "(AddLayerModal|error)" | head -10`
Expected: No errors related to AddLayerModal.tsx

**Step 3: Commit**

```bash
git add frontend/src/components/AddLayerModal.tsx
git commit -m "feat(ui): add AddLayerModal component for data import"
```

---

## Task 6: Update UIContext for New State

**Files:**
- Modify: `frontend/src/context/UIContext.tsx`

**Step 1: Add new state for bottom drawer and selected layer**

Replace entire file with:

```tsx
// frontend/src/context/UIContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UIContextValue {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Bottom drawer
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
  setDrawerExpanded: (expanded: boolean) => void;

  // Selected layer
  selectedLayerId: string | number | null;
  setSelectedLayerId: (id: string | number | null) => void;

  // Add layer modal
  isAddLayerModalOpen: boolean;
  openAddLayerModal: () => void;
  closeAddLayerModal: () => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [selectedLayerId, setSelectedLayerIdState] = useState<string | number | null>(null);
  const [isAddLayerModalOpen, setIsAddLayerModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
  const setSidebarOpen = useCallback((open: boolean) => setIsSidebarOpen(open), []);

  const toggleDrawer = useCallback(() => setIsDrawerExpanded((prev) => !prev), []);
  const setDrawerExpanded = useCallback((expanded: boolean) => setIsDrawerExpanded(expanded), []);

  const setSelectedLayerId = useCallback((id: string | number | null) => {
    setSelectedLayerIdState(id);
    if (id !== null) {
      setIsDrawerExpanded(true);
    }
  }, []);

  const openAddLayerModal = useCallback(() => setIsAddLayerModalOpen(true), []);
  const closeAddLayerModal = useCallback(() => setIsAddLayerModalOpen(false), []);

  const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);

  return (
    <UIContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        isDrawerExpanded,
        toggleDrawer,
        setDrawerExpanded,
        selectedLayerId,
        setSelectedLayerId,
        isAddLayerModalOpen,
        openAddLayerModal,
        closeAddLayerModal,
        isLoading,
        setLoading,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
```

**Step 2: Verify context compiles**

Run: `pnpm run type-check --filter=frontend 2>&1 | grep -E "(UIContext|error)" | head -20`
Expected: May show errors in files using old UIContext properties - that's expected, fixed in next task

**Step 3: Commit**

```bash
git add frontend/src/context/UIContext.tsx
git commit -m "feat(ui): update UIContext with new layout state"
```

---

## Task 7: Rewrite Home Page with New Layout

**Files:**
- Modify: `frontend/src/pages/Home.tsx`

**Step 1: Replace Home page with new layout**

```tsx
// frontend/src/pages/Home.tsx
import React, { useState, useMemo } from 'react';
import Map from '../components/Map';
import TopBar from '../components/TopBar';
import Sidebar from '../components/sidebar';
import BottomDrawer from '../components/BottomDrawer';
import AddLayerModal from '../components/AddLayerModal';
import { useUI } from '../context/UIContext';
import { useLayerUI } from '../context/LayerUIContext';
import { useLayers } from '../api/queries/layers';
import type { Layer } from '../components/sidebar/LayerList';

const Home: React.FC = () => {
  const {
    isSidebarOpen,
    toggleSidebar,
    isDrawerExpanded,
    toggleDrawer,
    selectedLayerId,
    setSelectedLayerId,
    isAddLayerModalOpen,
    openAddLayerModal,
    closeAddLayerModal,
  } = useUI();

  const { activeLayers, toggleLayerVisibility } = useLayerUI();
  const { data: layersData = [] } = useLayers();

  const [currentPage, setCurrentPage] = useState(1);

  // Transform layers to sidebar format
  const layers: Layer[] = useMemo(
    () =>
      layersData.map((layer: any) => ({
        id: layer.id,
        name: layer.name || `Layer ${layer.id}`,
        visible: activeLayers.has(String(layer.id)),
        type: layer.type,
      })),
    [layersData, activeLayers]
  );

  // Get selected layer data for drawer
  const selectedLayer = useMemo(
    () => layersData.find((l: any) => l.id === selectedLayerId),
    [layersData, selectedLayerId]
  );

  // Mock feature data - replace with actual layer features
  const featureData = useMemo(() => {
    if (!selectedLayer) return [];
    // This would come from actual layer data
    return [];
  }, [selectedLayer]);

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', width: '100px' },
  ];

  const handleToggleVisibility = (layerId: string | number) => {
    toggleLayerVisibility(String(layerId));
  };

  const handleLayerSelect = (layerId: string | number) => {
    setSelectedLayerId(layerId);
  };

  const handleAnalysisTool = (toolId: string) => {
    console.log('Analysis tool selected:', toolId);
    // Implement analysis tool handling
  };

  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    // Implement file upload handling - reuse DataManager logic
  };

  const handleApiConnect = (url: string) => {
    console.log('API connect:', url);
    // Implement API connection - reuse DataManager logic
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <TopBar onMenuClick={toggleSidebar} />

      <div
        style={{
          flex: 1,
          position: 'relative',
          marginTop: 'var(--topbar-height)',
          marginBottom: isDrawerExpanded ? 'var(--drawer-expanded)' : 'var(--drawer-collapsed)',
          marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : 0,
          transition: 'margin var(--transition-normal)',
        }}
      >
        <Map />
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        layers={layers}
        onToggleLayerVisibility={handleToggleVisibility}
        onLayerSelect={handleLayerSelect}
        onAddLayer={openAddLayerModal}
        onAnalysisTool={handleAnalysisTool}
        selectedLayerId={selectedLayerId}
      />

      <BottomDrawer
        isExpanded={isDrawerExpanded}
        onToggle={toggleDrawer}
        title="Features"
        subtitle={selectedLayer?.name}
        columns={columns}
        data={featureData}
        featureCount={featureData.length}
        currentPage={currentPage}
        totalPages={Math.ceil(featureData.length / 50) || 1}
        onPageChange={setCurrentPage}
      />

      <AddLayerModal
        isOpen={isAddLayerModalOpen}
        onClose={closeAddLayerModal}
        onFileUpload={handleFileUpload}
        onApiConnect={handleApiConnect}
      />
    </div>
  );
};

export default Home;
```

**Step 2: Verify page compiles**

Run: `pnpm run type-check --filter=frontend 2>&1 | grep -v ducksdb | head -30`
Expected: Should compile (may have warnings about unused old components)

**Step 3: Commit**

```bash
git add frontend/src/pages/Home.tsx
git commit -m "feat(ui): rewrite Home page with new layout structure"
```

---

## Task 8: Create styles directory if needed

**Files:**
- Ensure: `frontend/src/styles/` directory exists

**Step 1: Create directory**

Run: `mkdir -p frontend/src/styles`

**Step 2: Verify Task 1's variables.css is in place**

Run: `ls -la frontend/src/styles/`
Expected: variables.css exists

---

## Task 9: Visual Testing

**Step 1: Start dev server**

Run: `cd frontend && pnpm run start`

**Step 2: Manual verification checklist**

- [ ] TopBar shows at top with hamburger, title, user avatar
- [ ] Clicking hamburger toggles sidebar
- [ ] Sidebar shows Layers/Analysis tabs
- [ ] Layer list shows with search, visibility toggles
- [ ] "Add Layer" button opens modal
- [ ] Modal has Upload/API/Database tabs
- [ ] Bottom drawer shows collapsed by default
- [ ] Clicking layer expands drawer
- [ ] Map fills remaining space
- [ ] Layout responds to sidebar open/close

**Step 3: Fix any visual issues found**

---

## Task 10: Final Cleanup and Commit

**Step 1: Remove unused old components (optional - can keep for reference)**

Files that are now superseded:
- `frontend/src/bits/Sidebar.tsx` (old sidebar)
- `frontend/src/components/Sidebar.tsx` (old sidebar)
- `frontend/src/bits/DataManager.tsx` (moved to modal)
- `frontend/src/bits/Dashboard.tsx` (replaced by TopBar)

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat(ui): complete UI redesign with clean layout

- TopBar: minimal header with branding and user menu
- Sidebar: layers list + analysis tools, fully hideable
- BottomDrawer: collapsible data table for features
- AddLayerModal: centralized data import (upload, API)
- Professional light theme with consistent design tokens"
```

---

## Summary

| Task | Component | Files |
|------|-----------|-------|
| 1 | CSS Tokens | `styles/variables.css`, `index.css` |
| 2 | TopBar | `components/TopBar.tsx` |
| 3 | Sidebar | `components/sidebar/*` |
| 4 | BottomDrawer | `components/BottomDrawer.tsx` |
| 5 | AddLayerModal | `components/AddLayerModal.tsx` |
| 6 | UIContext | `context/UIContext.tsx` |
| 7 | Home Page | `pages/Home.tsx` |
| 8 | Styles Dir | `styles/` |
| 9 | Testing | Manual verification |
| 10 | Cleanup | Final commit |
