import { useEffect } from 'react';
import { motion } from 'framer-motion';
import BaseMap from './BaseMap';
import Sidebar from './Sidebar';
import { useUI } from '../context/UIContext';
import { useLayers } from '../api/queries/layers';

// Import SVG icons
import searchIcon from '../effects/Search.svg';

const Home: React.FC = () => {
    const { isSidebarOpen, toggleSidebar } = useUI();
    const { refetch: refetchLayers } = useLayers();

    // Initialize component
    useEffect(() => {
        // Fetch layers from the API
        refetchLayers();
    }, [refetchLayers]);

    // Toggle sidebar
    const handleToggleSidebar = () => {
        toggleSidebar();
    };

    return (
        <div className="home-container">
            {/* Map container */}
            <div
                className="map-container"
                onContextMenu={(e) => e.preventDefault()}
            >
                <BaseMap
                    className="map"
                    showLayerPanel={false}
                    showAnalyticsPanel={false}
                    showControls={false}
                />
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} />

            {/* Sidebar toggle button */}
            <motion.button
                className="toggle-sidebar-btn"
                onClick={handleToggleSidebar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle sidebar"
            >
                <img src={searchIcon} alt="Toggle sidebar" />
            </motion.button>
        </div>
    );
};

export default Home;
