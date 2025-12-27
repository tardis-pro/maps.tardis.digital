# Frontend Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove redundant dependencies, replace Redux with TanStack Query + Context, consolidate on Tailwind CSS, and add error boundaries.

**Architecture:** Server state managed by TanStack Query (auth, layers, analytics, data), UI state managed by React Context (map, ui, visualization). Error boundaries at global and route levels. All styling via Tailwind inline classes.

**Tech Stack:** React 19, TanStack Query, Zod, React Hook Form, Framer Motion, Tailwind CSS 4

---

## Phase 1: Setup

### Task 1.1: Add New Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add TanStack Query and Zod**

```bash
cd /home/pronit/workspace/tardis/maps.tardis.digital/frontend/.worktrees/frontend-modernization/frontend
pnpm add @tanstack/react-query zod
```

**Step 2: Verify installation**

Run: `pnpm list @tanstack/react-query zod`
Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add TanStack Query and Zod dependencies"
```

---

### Task 1.2: Create Query Client Provider

**Files:**
- Create: `src/api/queryClient.ts`

**Step 1: Create the query client configuration**

```typescript
// src/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 3,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});
```

**Step 2: Commit**

```bash
git add src/api/queryClient.ts
git commit -m "feat: add TanStack Query client configuration"
```

---

### Task 1.3: Create Global Error Boundary

**Files:**
- Create: `src/components/errors/GlobalErrorBoundary.tsx`

**Step 1: Create the error boundary component**

```typescript
// src/components/errors/GlobalErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                        <p className="text-gray-300 mb-6">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
```

**Step 2: Commit**

```bash
git add src/components/errors/GlobalErrorBoundary.tsx
git commit -m "feat: add global error boundary component"
```

---

### Task 1.4: Create Toast Context for Notifications

**Files:**
- Create: `src/context/ToastContext.tsx`

**Step 1: Create the toast context**

```typescript
// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    if (toasts.length === 0) return null;

    const bgColors: Record<ToastType, string> = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        error: 'bg-red-600',
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px]`}
                >
                    <span>{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-4 text-white hover:text-gray-200"
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
```

**Step 2: Commit**

```bash
git add src/context/ToastContext.tsx
git commit -m "feat: add toast context for notifications"
```

---

## Phase 2: Auth Migration

### Task 2.1: Create Auth Context

**Files:**
- Create: `src/context/AuthContext.tsx`

**Step 1: Create the auth context with TanStack Query**

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '../services/akgda';
import { RestAuthService } from '../services/akgda/services/RestAuthService';

interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');

    // Set token in OpenAPI config on mount
    useEffect(() => {
        if (token) {
            OpenAPI.TOKEN = token;
        }
    }, [token]);

    // Fetch user profile query
    const {
        data: user,
        isLoading: isUserLoading,
        error: userError,
    } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await RestAuthService.restAuthUserRetrieve();
            return {
                id: response.id,
                username: response.username,
                email: response.email,
                firstName: response.first_name,
                lastName: response.last_name,
            } as User;
        },
        enabled: !!token,
        retry: false,
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async ({ username, password }: { username: string; password: string }) => {
            const response = await RestAuthService.restAuthLoginCreate({ username, password });
            localStorage.setItem('token', response.key);
            OpenAPI.TOKEN = response.key;
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await RestAuthService.restAuthLogoutCreate();
            localStorage.removeItem('token');
            OpenAPI.TOKEN = undefined;
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });

    const login = async (username: string, password: string) => {
        await loginMutation.mutateAsync({ username, password });
    };

    const logout = async () => {
        await logoutMutation.mutateAsync();
    };

    const isLoading = isUserLoading || loginMutation.isPending || logoutMutation.isPending;
    const error = userError?.message || loginMutation.error?.message || logoutMutation.error?.message || null;

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isAuthenticated: !!token,
                isLoading,
                error,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
```

**Step 2: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add auth context with TanStack Query"
```

---

### Task 2.2: Update Signin Component

**Files:**
- Modify: `src/bits/Signin.tsx`

**Step 1: Replace Redux with AuthContext**

```typescript
// src/bits/Signin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Signin: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading, error: authError } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setError('');

        try {
            await login(username, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        }
    };

    const displayError = error || authError;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <motion.div
                className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>

                {displayError && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                        {displayError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-300 mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors ${
                            isLoading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="mt-4 flex justify-between text-sm">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/resetpassword');
                            }}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Forgot Password?
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/signup');
                            }}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Create Account
                        </a>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Signin;
```

**Step 2: Commit**

```bash
git add src/bits/Signin.tsx
git commit -m "refactor: update Signin to use AuthContext"
```

---

## Phase 3: Core UI Context Migration

### Task 3.1: Create UI Context

**Files:**
- Create: `src/context/UIContext.tsx`

**Step 1: Create the UI context (replaces uiSlice)**

```typescript
// src/context/UIContext.tsx
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
```

**Step 2: Commit**

```bash
git add src/context/UIContext.tsx
git commit -m "feat: add UI context (replaces uiSlice)"
```

---

### Task 3.2: Create Map Context

**Files:**
- Create: `src/context/MapContext.tsx`

**Step 1: Create the map context (replaces mapSlice)**

```typescript
// src/context/MapContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    maxZoom?: number;
    minZoom?: number;
}

interface MapContextValue {
    viewState: ViewState;
    baseMapStyle: string;
    isMapLoaded: boolean;
    selectedFeature: any | null;
    setViewState: (viewState: Partial<ViewState>) => void;
    setBaseMapStyle: (style: string) => void;
    setMapLoaded: (loaded: boolean) => void;
    setSelectedFeature: (feature: any | null) => void;
}

const defaultViewState: ViewState = {
    longitude: 77.58548,
    latitude: 12.94401,
    zoom: 12,
    pitch: 0,
    bearing: 0,
    maxZoom: 24,
    minZoom: 1.5,
};

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
    const [viewState, setViewStateInternal] = useState<ViewState>(defaultViewState);
    const [baseMapStyle, setBaseMapStyleState] = useState('dark');
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [selectedFeature, setSelectedFeatureState] = useState<any | null>(null);

    const setViewState = useCallback((partial: Partial<ViewState>) => {
        setViewStateInternal((prev) => ({ ...prev, ...partial }));
    }, []);

    const setBaseMapStyle = useCallback((style: string) => setBaseMapStyleState(style), []);
    const setMapLoaded = useCallback((loaded: boolean) => setIsMapLoaded(loaded), []);
    const setSelectedFeature = useCallback((feature: any | null) => setSelectedFeatureState(feature), []);

    return (
        <MapContext.Provider
            value={{
                viewState,
                baseMapStyle,
                isMapLoaded,
                selectedFeature,
                setViewState,
                setBaseMapStyle,
                setMapLoaded,
                setSelectedFeature,
            }}
        >
            {children}
        </MapContext.Provider>
    );
}

export function useMap() {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within a MapProvider');
    }
    return context;
}
```

**Step 2: Commit**

```bash
git add src/context/MapContext.tsx
git commit -m "feat: add map context (replaces mapSlice)"
```

---

### Task 3.3: Create Visualization Context

**Files:**
- Create: `src/context/VisualizationContext.tsx`

**Step 1: First read the current visualizationSlice to understand the state shape**

```bash
cat src/redux/slices/visualizationSlice.ts
```

**Step 2: Create the visualization context (after reading the slice)**

Note: Implementation depends on what's in the slice. Create a context that mirrors the slice state.

**Step 3: Commit**

```bash
git add src/context/VisualizationContext.tsx
git commit -m "feat: add visualization context (replaces visualizationSlice)"
```

---

## Phase 4: Data Layer Migration

### Task 4.1: Create Layers Query Hooks

**Files:**
- Create: `src/api/queries/layers.ts`

**Step 1: First read the current layerSlice**

```bash
cat src/redux/slices/layerSlice.ts
```

**Step 2: Create TanStack Query hooks for layers**

Note: Implementation depends on the API endpoints used in the slice.

**Step 3: Commit**

```bash
git add src/api/queries/layers.ts
git commit -m "feat: add TanStack Query hooks for layers"
```

---

### Task 4.2: Create Analytics Query Hooks

**Files:**
- Create: `src/api/queries/analytics.ts`

**Step 1: First read the current analyticsSlice**

```bash
cat src/redux/slices/analyticsSlice.ts
```

**Step 2: Create TanStack Query hooks for analytics**

**Step 3: Commit**

```bash
git add src/api/queries/analytics.ts
git commit -m "feat: add TanStack Query hooks for analytics"
```

---

### Task 4.3: Create Data Query Hooks

**Files:**
- Create: `src/api/queries/data.ts`

**Step 1: First read the current dataSlice**

```bash
cat src/redux/slices/dataSlice.ts
```

**Step 2: Create TanStack Query hooks for data**

**Step 3: Commit**

```bash
git add src/api/queries/data.ts
git commit -m "feat: add TanStack Query hooks for data"
```

---

### Task 4.4: Create Analysis Query Hooks

**Files:**
- Create: `src/api/queries/analysis.ts`

**Step 1: First read the current analysisSlice**

```bash
cat src/redux/slices/analysisSlice.ts
```

**Step 2: Create TanStack Query hooks for analysis**

**Step 3: Commit**

```bash
git add src/api/queries/analysis.ts
git commit -m "feat: add TanStack Query hooks for analysis"
```

---

## Phase 5: App Providers Setup

### Task 5.1: Create Combined App Providers

**Files:**
- Create: `src/providers/AppProviders.tsx`

**Step 1: Create the combined providers wrapper**

```typescript
// src/providers/AppProviders.tsx
import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { AuthProvider } from '../context/AuthContext';
import { UIProvider } from '../context/UIContext';
import { MapProvider } from '../context/MapContext';
import { ToastProvider } from '../context/ToastContext';
import { GlobalErrorBoundary } from '../components/errors/GlobalErrorBoundary';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <GlobalErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <AuthProvider>
                        <UIProvider>
                            <MapProvider>
                                {children}
                            </MapProvider>
                        </UIProvider>
                    </AuthProvider>
                </ToastProvider>
            </QueryClientProvider>
        </GlobalErrorBoundary>
    );
}
```

**Step 2: Commit**

```bash
git add src/providers/AppProviders.tsx
git commit -m "feat: add combined AppProviders wrapper"
```

---

### Task 5.2: Update App.tsx to Use New Providers

**Files:**
- Modify: `src/App.tsx`

**Step 1: Replace Redux Provider with AppProviders**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AppProviders } from './providers/AppProviders';
import { useAuth } from './context/AuthContext';
import Signin from './bits/Signin';
import Signup from './bits/Signup';
import ResetPassword from './bits/PasswordChange';
import Home from './bits/Home';

const Dashboard = lazy(() => import('./bits/Dashboard'));
const Settings = lazy(() => import('./bits/Settings'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
}

const Loading = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

function AppRoutes() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <BrowserRouter>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/signin" element={<Signin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/resetpassword" element={<ResetPassword />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export function App() {
    return (
        <AppProviders>
            <AppRoutes />
        </AppProviders>
    );
}

export default App;
```

**Step 2: Verify the app compiles**

Run: `pnpm vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: update App.tsx to use AppProviders"
```

---

## Phase 6: Component Migration

### Task 6.1: Update Sidebar Component

**Files:**
- Modify: `src/bits/Sidebar.tsx`

**Step 1: Read current Sidebar implementation**

```bash
cat src/bits/Sidebar.tsx
```

**Step 2: Replace Redux useSelector/useDispatch with useUI context**

**Step 3: Commit**

```bash
git add src/bits/Sidebar.tsx
git commit -m "refactor: update Sidebar to use UIContext"
```

---

### Task 6.2: Update BaseMap Component

**Files:**
- Modify: `src/bits/BaseMap.tsx`

**Step 1: Read current BaseMap implementation**

```bash
cat src/bits/BaseMap.tsx
```

**Step 2: Replace Redux with useMap context**

**Step 3: Commit**

```bash
git add src/bits/BaseMap.tsx
git commit -m "refactor: update BaseMap to use MapContext"
```

---

### Task 6.3: Update Home Component

**Files:**
- Modify: `src/bits/Home.tsx`

**Step 1: Read current Home implementation**

```bash
cat src/bits/Home.tsx
```

**Step 2: Replace Redux with context hooks**

**Step 3: Commit**

```bash
git add src/bits/Home.tsx
git commit -m "refactor: update Home to use context hooks"
```

---

### Task 6.4-6.N: Update Remaining Components

For each component that uses Redux:
1. Read the component
2. Identify which slice(s) it uses
3. Replace with appropriate context or query hooks
4. Commit

Components to update:
- `src/bits/Dashboard.tsx`
- `src/bits/Settings.tsx`
- `src/bits/AnalyticsPanel.tsx`
- `src/bits/DataManager.tsx`
- `src/bits/LayerPanel.tsx`
- `src/bits/VisualizationControls.tsx`
- `src/bits/Legend.tsx`
- Any other components using Redux

---

## Phase 7: Styling Migration

### Task 7.1: Update Tailwind Config with CSS Variables

**Files:**
- Modify: `tailwind.config.js`

**Step 1: Add theme extensions from App.css variables**

```javascript
// tailwind.config.js
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#1e40af',
                background: '#0f172a',
                border: '#334155',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
```

**Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add custom colors to Tailwind config"
```

---

### Task 7.2: Convert Sidebar CSS to Tailwind

**Files:**
- Modify: Components that import `effects/Sidebar.css`
- Delete: `src/effects/Sidebar.css`

**Step 1: Read the CSS file**

```bash
cat src/effects/Sidebar.css
```

**Step 2: For each CSS class, add equivalent Tailwind classes to the component**

**Step 3: Remove the CSS import from the component**

**Step 4: Delete the CSS file**

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: convert Sidebar CSS to Tailwind classes"
```

---

### Task 7.3-7.N: Convert Remaining CSS Files

Repeat for each CSS file:
- `src/effects/VisualizationControls.css`
- `src/effects/AnalyticsPanel.css`
- `src/effects/Home.css`
- `src/effects/DataManager.css`
- `src/effects/Profile.css`
- `src/components/Sidebar.css`
- `src/pages/Home.css`
- `src/bits/SpatialAnalysisPanel.css`

For each:
1. Read the CSS
2. Convert to Tailwind classes in component
3. Remove import
4. Delete CSS file
5. Commit

---

### Task 7.4: Consolidate Global CSS

**Files:**
- Modify: `src/index.css`
- Delete: `src/App.css`, `src/styles.css`

**Step 1: Keep only essential reset in index.css**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
```

**Step 2: Delete App.css and styles.css**

**Step 3: Remove imports from components**

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: consolidate global CSS to index.css"
```

---

## Phase 8: Cleanup

### Task 8.1: Remove Redux Files

**Files:**
- Delete: `src/redux/` directory

**Step 1: Delete the entire redux directory**

```bash
rm -rf src/redux/
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove Redux files"
```

---

### Task 8.2: Remove Unused Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove deprecated packages**

```bash
pnpm remove @reduxjs/toolkit react-redux redux redux-in-worker formik yup animejs popmotion @emotion/react styled-components
```

**Step 2: Verify installation**

```bash
pnpm install
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove unused dependencies"
```

---

### Task 8.3: Remove Legacy Files

**Files:**
- Delete: `src/redux/actions.js` (if exists)
- Delete: `src/redux/reducers.js` (if exists)

**Step 1: Remove any remaining legacy files**

```bash
rm -f src/redux/actions.js src/redux/reducers.js 2>/dev/null || true
```

**Step 2: Commit if any files were removed**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore: remove legacy Redux files"
```

---

### Task 8.4: Final Verification

**Step 1: Run type check**

```bash
pnpm run type-check
```

Expected: No new type errors (pre-existing ducksdb errors are acceptable)

**Step 2: Run build**

```bash
pnpm vite build
```

Expected: Build succeeds

**Step 3: Run linter**

```bash
pnpm run lint
```

Expected: No errors (warnings acceptable)

**Step 4: Create final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```

---

## Summary

**Files Created:**
- `src/api/queryClient.ts`
- `src/api/queries/layers.ts`
- `src/api/queries/analytics.ts`
- `src/api/queries/data.ts`
- `src/api/queries/analysis.ts`
- `src/context/AuthContext.tsx`
- `src/context/UIContext.tsx`
- `src/context/MapContext.tsx`
- `src/context/VisualizationContext.tsx`
- `src/context/ToastContext.tsx`
- `src/components/errors/GlobalErrorBoundary.tsx`
- `src/providers/AppProviders.tsx`

**Files Modified:**
- `package.json`
- `tailwind.config.js`
- `src/App.tsx`
- `src/index.css`
- All components in `src/bits/` that use Redux

**Files Deleted:**
- `src/redux/` (entire directory)
- All CSS files in `src/effects/`
- `src/components/Sidebar.css`
- `src/pages/Home.css`
- `src/bits/SpatialAnalysisPanel.css`
- `src/App.css`
- `src/styles.css`

**Dependencies Removed:**
- `@reduxjs/toolkit`
- `react-redux`
- `redux`
- `redux-in-worker`
- `formik`
- `yup`
- `animejs`
- `popmotion`
- `@emotion/react`
- `styled-components`

**Dependencies Added:**
- `@tanstack/react-query`
- `zod`
