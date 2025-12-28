import React from 'react';
import { motion } from 'framer-motion';

interface NotificationProps {
    isOpen: boolean;
}

const Notification: React.FC<NotificationProps> = ({ isOpen }) => {
    return (
        <motion.div
            className="flex items-center p-3 hover:bg-gray-700 rounded-md cursor-pointer"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
            {isOpen && <span className="ml-3 text-gray-300">Notifications</span>}
        </motion.div>
    );
};

export default Notification;
