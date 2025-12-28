import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

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

  // Grid layout (for bits/Home.tsx dashboard)
  gridLayout: GridLayoutItem[];
  updateGridLayout: (layout: GridLayoutItem[]) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

const defaultGridLayout: GridLayoutItem[] = [
  { i: '0', x: 0, y: 0, w: 1, h: 2 },
  { i: '1', x: 1, y: 0, w: 1, h: 2 },
  { i: '2', x: 2, y: 0, w: 1, h: 2 },
  { i: '3', x: 3, y: 0, w: 1, h: 2 },
  { i: '4', x: 4, y: 0, w: 1, h: 2 },
  { i: '5', x: 5, y: 0, w: 1, h: 2 },
];

export function UIProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [selectedLayerId, setSelectedLayerIdState] = useState<string | number | null>(null);
  const [isAddLayerModalOpen, setIsAddLayerModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gridLayout, setGridLayout] = useState<GridLayoutItem[]>(defaultGridLayout);

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

  const updateGridLayout = useCallback((layout: GridLayoutItem[]) => setGridLayout(layout), []);

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
        gridLayout,
        updateGridLayout,
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
