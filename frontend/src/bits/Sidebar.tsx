import React from 'react';
import { motion } from 'framer-motion';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import Notification from './Notification';
import Settings from './Settings';
import Navigation from './Navigation';

// Define variants outside the component to avoid re-definition on each render
const overlayVariants = {
    closed: {
        opacity: 0,
        pointerEvents: 'none' as const,
    },
    open: {
        opacity: 1,
        pointerEvents: 'auto' as const,
    },
};

const sidebarVariants = {
    closed: {
        width: 63,
        transition: {
            width: { type: 'spring', stiffness: 400, damping: 40 },
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
    open: {
        width: 250,
        transition: {
            width: { type: 'spring', stiffness: 400, damping: 40 },
            staggerChildren: 0.05,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    closed: {
        opacity: 0,
        x: -20,
        transition: { opacity: { duration: 0.2 } },
    },
    open: {
        opacity: 1,
        x: 0,
        transition: { opacity: { duration: 0.2 } },
    },
};

interface SidebarProps {
    isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const { user } = useAuth();
    const { toggleSidebar, setSidebarOpen } = useUI();

    // Handle sidebar toggle
    const handleToggle = () => {
        toggleSidebar();
    };

    // Handle sidebar close on overlay click
    const handleOverlayClick = () => {
        setSidebarOpen(false);
    };

    return (
        <>
            {/* Overlay */}
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 z-10"
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
                variants={overlayVariants}
                onClick={handleOverlayClick}
            />

            {/* Sidebar */}
            <motion.div
                className="sidebar"
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
            >
                {/* Profile section */}
                <div className="p-4 border-b border-gray-700">
                    <motion.div
                        className="flex items-center"
                        variants={itemVariants}
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                            {user
                                ? user.firstName.charAt(0) +
                                  user.lastName.charAt(0)
                                : 'G'}
                        </div>
                        {isOpen && (
                            <motion.div variants={itemVariants}>
                                <div className="font-medium text-white">
                                    {user
                                        ? `${user.firstName} ${user.lastName}`
                                        : 'Guest User'}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {user ? user.email : 'Not signed in'}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Navigation items */}
                <div className="py-4">
                    <Dashboard toggle={handleToggle} isOpen={isOpen} />
                    <Notification isOpen={isOpen} />
                    <Settings isOpen={isOpen} />
                    <Navigation isOpen={isOpen} />
                </div>

                {/* Footer */}
                <div className="mt-auto p-4 border-t border-gray-700 text-xs text-gray-500">
                    <motion.div variants={itemVariants}>
                        {isOpen ? 'GIS Dashboard v1.0.0' : 'v1.0'}
                    </motion.div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
