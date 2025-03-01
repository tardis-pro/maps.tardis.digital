import React from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { toggleLayerVisibility } from '../redux/slices/layerSlice';

// Define navigation items
const items = [
    { id: 'buildings', text: 'Buildings', icon: '🏢' },
    { id: 'roads', text: 'Roads', icon: '🛣️' },
    { id: 'water', text: 'Water', icon: '💧' },
    { id: 'parks', text: 'Parks', icon: '🌳' },
    { id: 'poi', text: 'Points of Interest', icon: '📍' },
    { id: 'boundaries', text: 'Boundaries', icon: '🗺️' }
];

interface NavigationProps {
    isOpen: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen }) => {
    const dispatch = useDispatch();

    // Handle layer toggle
    const handleLayerToggle = (layerId: string) => {
        dispatch(toggleLayerVisibility(layerId));
    };

    return (
        <div className="mt-4">
            <h3 className={`px-3 text-xs uppercase text-gray-500 font-semibold ${!isOpen && 'text-center'}`}>
                {isOpen ? 'Map Layers' : 'Layers'}
            </h3>
            <div className="mt-2 space-y-1">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        className="flex items-center p-3 hover:bg-gray-700 rounded-md cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLayerToggle(item.id)}
                    >
                        <span className="text-xl">{item.icon}</span>
                        {isOpen && (
                            <span className="ml-3 text-gray-300">{item.text}</span>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Navigation;
