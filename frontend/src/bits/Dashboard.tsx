import React from 'react';
import { motion } from 'framer-motion';

interface DashboardProps {
    toggle: () => void;
    isOpen: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ toggle, isOpen }) => {
    return (
        <motion.div
            className="flex items-center p-3 hover:bg-gray-700 rounded-md cursor-pointer"
            onClick={toggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <svg
                className="w-6 h-6 text-gray-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>
            {isOpen && <span className="ml-3 text-gray-300">Dashboard</span>}
        </motion.div>
    );
};

export default Dashboard;
