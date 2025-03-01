import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
    isSidebarOpen: boolean;
    activeTab: string;
    isDarkMode: boolean;
    notifications: Array<{
        id: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        timestamp: number;
    }>;
    isLoading: boolean;
    gridLayout: Array<{
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        isResizable: boolean;
    }>;
}

const initialState: UiState = {
    isSidebarOpen: false,
    activeTab: 'map',
    isDarkMode: true,
    notifications: [],
    isLoading: false,
    gridLayout: [
        { i: "0", x: 0, y: 0, w: 2, h: 2, isResizable: false },
        { i: "1", x: 2, y: 0, w: 1, h: 1, isResizable: false },
        { i: "2", x: 3, y: 0, w: 2, h: 1, isResizable: false },
        { i: "3", x: 5, y: 0, w: 1, h: 2, isResizable: false },
        { i: "4", x: 2, y: 1, w: 1, h: 1, isResizable: false },
        { i: "5", x: 3, y: 1, w: 2, h: 1, isResizable: false },
    ]
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSidebarOpen = action.payload;
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
        toggleDarkMode: (state) => {
            state.isDarkMode = !state.isDarkMode;
        },
        addNotification: (state, action: PayloadAction<{
            message: string;
            type: 'info' | 'success' | 'warning' | 'error';
        }>) => {
            const { message, type } = action.payload;
            state.notifications.push({
                id: Date.now().toString(),
                message,
                type,
                timestamp: Date.now()
            });
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(
                notification => notification.id !== action.payload
            );
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        updateGridLayout: (state, action: PayloadAction<UiState['gridLayout']>) => {
            state.gridLayout = action.payload;
        }
    }
});

export const {
    toggleSidebar,
    setSidebarOpen,
    setActiveTab,
    toggleDarkMode,
    addNotification,
    removeNotification,
    setLoading,
    updateGridLayout
} = uiSlice.actions;

export default uiSlice.reducer;
