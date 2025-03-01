import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import BaseMap from './BaseMap';
import Sidebar from './Sidebar';
import Uploader from "./Uploader";
import CatalogDial from "./Sources";
import DataManager from "./DataManager";
import AnalyticsPanel from "./AnalyticsPanel";
import VisualizationControls from "./VisualizationControls";
import { RootState } from '../redux/types';
import { updateGridLayout } from '../redux/slices/uiSlice';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { fetchLayers } from '../redux/slices/layerSlice';
import { setViewState } from '../redux/slices/mapSlice';
import { AppDispatch } from '../redux/store';
import '../effects/Home.css';

// Import SVG icons
import searchIcon from '../effects/Search.svg';

const Home: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isSidebarOpen } = useSelector((state: RootState) => state.ui);
    const { gridLayout } = useSelector((state: RootState) => state.ui);
    const { viewState } = useSelector((state: RootState) => state.map);
    const { selectedAnalyticsMode } = useSelector((state: RootState) => state.analytics);

    // Local state
    const [mounted, setMounted] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
    const [showVisualizationControls, setShowVisualizationControls] = useState(false);

    // Initialize component
    useEffect(() => {
        setMounted(true);

        // Fetch layers from the API
        dispatch(fetchLayers());

        // Handle window resize
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            setMounted(false);
            window.removeEventListener('resize', handleResize);
        };
    }, [dispatch]);

    // Handle file uploads
    const updateUploadedFiles = (files: File[]) => {
        setUploadedFiles(files);
    };

    // Handle layout changes
    const onLayoutChange = (newLayout: any) => {
        const fixedLayout = fixLayout(newLayout);
        dispatch(updateGridLayout(fixedLayout));
    };

    // Toggle sidebar
    const handleToggleSidebar = () => {
        dispatch(toggleSidebar());
    };

    // Toggle analytics panel
    const handleToggleAnalyticsPanel = () => {
        setShowAnalyticsPanel(!showAnalyticsPanel);
    };

    // Toggle visualization controls
    const handleToggleVisualizationControls = () => {
        setShowVisualizationControls(!showVisualizationControls);
    };

    // Fix layout to maintain grid structure
    const fixLayout = (layout: any[]) => {
        const maxY = 1;
        const xs = [0, 1, 2, 3, 4, 5];

        // Find which columns exist in the max row
        const maxRowXs = layout
            .flatMap(item => {
                if (item.y === maxY || (item.y === maxY - 1 && item.h === 2)) {
                    return item.w === 2 ? [item.x, item.x + 1] : [item.x];
                }
                return [];
            })
            .filter(Boolean);

        // Find the missing column
        const missingX = xs.find(value => !maxRowXs.includes(value));

        // Fix layout by placing items from new rows into the max row
        return layout.map(item => {
            if (item.y > maxY && missingX !== undefined) {
                return {
                    ...item,
                    y: maxY,
                    x: missingX
                };
            }
            return item;
        });
    };

    // Define dashboard widgets
    const renderWidgetContent = (itemId: string) => {
        switch (itemId) {
            case "0":
                return <CatalogDial />;
            case "1":
                return <Uploader updateUploadedFiles={updateUploadedFiles} />;
            case "2":
                return (
                    <div className="p-4 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg text-white h-full">
                        <h2 className="text-xl font-bold mb-4">Map Controls</h2>
                        <div className="space-y-2">
                            <button
                                className="w-full py-2 px-4 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors"
                                onClick={() => dispatch(setViewState({ pitch: viewState.pitch === 0 ? 45 : 0 }))}
                            >
                                Toggle 3D View
                            </button>
                            <button
                                className="w-full py-2 px-4 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors"
                                onClick={() => dispatch(setViewState({
                                    longitude: 77.58548,
                                    latitude: 12.94401,
                                    zoom: 12,
                                    pitch: 0,
                                    bearing: 0
                                }))}
                            >
                                Reset View
                            </button>
                            <button
                                className="w-full py-2 px-4 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors"
                                onClick={handleToggleAnalyticsPanel}
                            >
                                {showAnalyticsPanel ? 'Hide Analytics' : 'Show Analytics'}
                            </button>
                            <button
                                className="w-full py-2 px-4 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors"
                                onClick={handleToggleVisualizationControls}
                            >
                                {showVisualizationControls ? 'Hide Styling' : 'Style Data'}
                            </button>
                        </div>
                    </div>
                );
            case "3":
                return (
                    <div className="p-4 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg text-white h-full">
                        <h2 className="text-xl font-bold mb-4">Statistics</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Layers:</span>
                                <span className="font-bold">5</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Features:</span>
                                <span className="font-bold">1,245</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Analysis:</span>
                                <span className="font-bold">{selectedAnalyticsMode || 'None'}</span>
                            </div>
                        </div>
                    </div>
                );
            case "4":
                return <DataManager />;
            case "5":
                return (
                    <div className="p-4 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg text-white h-full">
                        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2 px-3 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors text-sm">
                                Export Map
                            </button>
                            <button className="py-2 px-3 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors text-sm">
                                Share View
                            </button>
                            <button className="py-2 px-3 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors text-sm">
                                Save Analysis
                            </button>
                            <button className="py-2 px-3 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors text-sm">
                                Measure
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="home-container">
            {/* Map container */}
            <div
                className="map-container"
                onContextMenu={(e) => e.preventDefault()}
            >
                <BaseMap className="map" />
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} />

            {/* Analytics Panel */}
            {showAnalyticsPanel && <AnalyticsPanel />}
            
            {/* Visualization Controls */}
            {showVisualizationControls && (
                <VisualizationControls 
                    onClose={handleToggleVisualizationControls} 
                />
            )}

            {/* Dashboard grid */}
            {mounted && (
                <div className="grid-container">
                    <GridLayout
                        className="layout"
                        layout={gridLayout}
                        cols={6}
                        rowHeight={100}
                        width={windowWidth}
                        onLayoutChange={onLayoutChange}
                        isDraggable={true}
                        isResizable={false}
                        margin={[10, 10]}
                    >
                        {gridLayout.map(item => (
                            <div key={item.i} className="grid-item">
                                {renderWidgetContent(item.i)}
                            </div>
                        ))}
                    </GridLayout>
                </div>
            )}

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
