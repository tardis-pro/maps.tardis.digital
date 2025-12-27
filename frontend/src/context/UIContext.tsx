import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GridItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    isResizable: boolean;
}

interface UIContextValue {
    isSidebarOpen: boolean;
    activeTab: string;
    isDarkMode: boolean;
    isLoading: boolean;
    gridLayout: GridItem[];
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setActiveTab: (tab: string) => void;
    toggleDarkMode: () => void;
    setLoading: (loading: boolean) => void;
    updateGridLayout: (layout: GridItem[]) => void;
}

const defaultGridLayout: GridItem[] = [
    { i: '0', x: 0, y: 0, w: 2, h: 2, isResizable: false },
    { i: '1', x: 2, y: 0, w: 1, h: 1, isResizable: false },
    { i: '2', x: 3, y: 0, w: 2, h: 1, isResizable: false },
    { i: '3', x: 5, y: 0, w: 1, h: 2, isResizable: false },
    { i: '4', x: 2, y: 1, w: 1, h: 1, isResizable: false },
    { i: '5', x: 3, y: 1, w: 2, h: 1, isResizable: false },
];

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTabState] = useState('map');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [gridLayout, setGridLayout] = useState<GridItem[]>(defaultGridLayout);

    const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
    const setSidebarOpen = useCallback((open: boolean) => setIsSidebarOpen(open), []);
    const setActiveTab = useCallback((tab: string) => setActiveTabState(tab), []);
    const toggleDarkMode = useCallback(() => setIsDarkMode((prev) => !prev), []);
    const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);
    const updateGridLayout = useCallback((layout: GridItem[]) => setGridLayout(layout), []);

    return (
        <UIContext.Provider
            value={{
                isSidebarOpen,
                activeTab,
                isDarkMode,
                isLoading,
                gridLayout,
                toggleSidebar,
                setSidebarOpen,
                setActiveTab,
                toggleDarkMode,
                setLoading,
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
