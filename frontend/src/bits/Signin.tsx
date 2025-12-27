import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Signin: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading, error: authError } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Sync authError from context to local error state
    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setError('');

        try {
            await login(username, password);
            // Navigate to home page on success
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <motion.div
                className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>

                {error && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                        {error}
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
                        className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors ${isLoading
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
