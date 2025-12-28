import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PasswordChange: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRequestReset = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setSuccess('Reset code sent to your email');
            setStep(2);
        }, 1000);
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();

        if (!code) {
            setError('Please enter the reset code');
            return;
        }

        if (!newPassword) {
            setError('Please enter a new password');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setSuccess('Password reset successfully');
            setTimeout(() => {
                navigate('/signin');
            }, 2000);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <motion.div
                className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    {step === 1 ? 'Reset Password' : 'Enter New Password'}
                </h2>

                {error && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleRequestReset}>
                        <div className="mb-4">
                            <label
                                className="block text-gray-300 mb-2"
                                htmlFor="email"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                        >
                            Send Reset Code
                        </button>

                        <div className="mt-4 text-center">
                            <a
                                href="#"
                                onClick={() => navigate('/signin')}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                                Back to Sign In
                            </a>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="mb-4">
                            <label
                                className="block text-gray-300 mb-2"
                                htmlFor="code"
                            >
                                Reset Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter reset code"
                            />
                        </div>

                        <div className="mb-4">
                            <label
                                className="block text-gray-300 mb-2"
                                htmlFor="newPassword"
                            >
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="mb-6">
                            <label
                                className="block text-gray-300 mb-2"
                                htmlFor="confirmPassword"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm new password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                        >
                            Reset Password
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default PasswordChange;
