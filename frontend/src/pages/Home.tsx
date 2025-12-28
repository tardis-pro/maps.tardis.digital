import React, { useState, useMemo } from 'react';
import Map from '../components/Map';
import TopBar from '../components/TopBar';
import Sidebar from '../components/sidebar';
import BottomDrawer from '../components/BottomDrawer';
import AddLayerModal from '../components/AddLayerModal';
import { useUI } from '../context/UIContext';
import { useLayerUI } from '../context/LayerUIContext';
import { useLayers } from '../api/queries/layers';
import type { Layer } from '../components/sidebar/LayerList';

const Home: React.FC = () => {
    const {
        isSidebarOpen,
        toggleSidebar,
        isDrawerExpanded,
        toggleDrawer,
        selectedLayerId,
        setSelectedLayerId,
        isAddLayerModalOpen,
        openAddLayerModal,
        closeAddLayerModal,
    } = useUI();

    const { activeLayers, toggleLayerVisibility } = useLayerUI();
    const { data: layersData = [] } = useLayers();

    const [currentPage, setCurrentPage] = useState(1);

    // Transform layers to sidebar format
    const layers: Layer[] = useMemo(
        () =>
            layersData.map((layer: any) => ({
                id: layer.id,
                name: layer.name || `Layer ${layer.id}`,
                visible: activeLayers.has(String(layer.id)),
                type: layer.type,
            })),
        [layersData, activeLayers]
    );

    // Get selected layer data for drawer
    const selectedLayer = useMemo(
        () => layersData.find((l: any) => l.id === selectedLayerId),
        [layersData, selectedLayerId]
    );

    // Mock feature data - replace with actual layer features
    const featureData = useMemo(() => {
        if (!selectedLayer) return [];
        // This would come from actual layer data
        return [];
    }, [selectedLayer]);

    const columns = [
        { key: 'id', label: 'ID', width: '80px' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type', width: '100px' },
    ];

    const handleToggleVisibility = (layerId: string | number) => {
        toggleLayerVisibility(String(layerId));
    };

    const handleLayerSelect = (layerId: string | number) => {
        setSelectedLayerId(layerId);
    };

    const handleAnalysisTool = (toolId: string) => {
        console.log('Analysis tool selected:', toolId);
        // Implement analysis tool handling
    };

    const handleFileUpload = (files: File[]) => {
        console.log('Files uploaded:', files);
        // Implement file upload handling - reuse DataManager logic
    };

    const handleApiConnect = (url: string) => {
        console.log('API connect:', url);
        // Implement API connection - reuse DataManager logic
    };

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <TopBar onMenuClick={toggleSidebar} />

            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    marginTop: 'var(--topbar-height)',
                    marginBottom: isDrawerExpanded
                        ? 'var(--drawer-expanded)'
                        : 'var(--drawer-collapsed)',
                    marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : 0,
                    transition: 'margin var(--transition-normal)',
                }}
            >
                <Map />
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                layers={layers}
                onToggleLayerVisibility={handleToggleVisibility}
                onLayerSelect={handleLayerSelect}
                onAddLayer={openAddLayerModal}
                onAnalysisTool={handleAnalysisTool}
                selectedLayerId={selectedLayerId}
            />

            <BottomDrawer
                isExpanded={isDrawerExpanded}
                onToggle={toggleDrawer}
                title="Features"
                subtitle={selectedLayer?.name}
                columns={columns}
                data={featureData}
                featureCount={featureData.length}
                currentPage={currentPage}
                totalPages={Math.ceil(featureData.length / 50) || 1}
                onPageChange={setCurrentPage}
            />

            <AddLayerModal
                isOpen={isAddLayerModalOpen}
                onClose={closeAddLayerModal}
                onFileUpload={handleFileUpload}
                onApiConnect={handleApiConnect}
            />
        </div>
    );
};

export default Home;
