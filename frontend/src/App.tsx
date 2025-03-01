import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { Suspense, lazy, useEffect, useState } from 'react';
import store from './redux/store';
import Signin from './bits/Signin';
import Signup from './bits/Signup';
import ResetPassword from './bits/PasswordChange';
import Home from './bits/Home';
import './App.css';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./bits/Dashboard'));
const Settings = lazy(() => import('./bits/Settings'));

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // This is a simple auth check - in a real app, you'd check for a valid token
    const isAuthenticated = localStorage.getItem('token') !== null;

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
};

// Loading component for suspense fallback
const Loading = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading resources
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <Provider store={store}>
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
        </Provider>
    );
}

export default App;
