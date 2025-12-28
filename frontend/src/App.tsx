import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AppProviders } from './providers/AppProviders';
import { useAuth } from './context/AuthContext';
import Signin from './bits/Signin';
import Signup from './bits/Signup';
import ResetPassword from './bits/PasswordChange';
import Home from './bits/Home';

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
