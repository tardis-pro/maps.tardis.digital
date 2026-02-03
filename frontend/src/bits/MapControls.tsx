import React from 'react';
import {
    FaLayerGroup,
    FaDownload,
    FaRuler,
    FaShareAlt,
    FaMapMarkedAlt,
} from 'react-icons/fa';

interface MapControlsProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    onBasemapChange: (style: string) => void;
    onExportMap: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
    position = 'top-right',
    onBasemapChange,
    onExportMap,
}) => {
    const positionStyles = {
        'top-right': { top: '10px', right: '10px' },
        'top-left': { top: '10px', left: '10px' },
        'bottom-right': { bottom: '10px', right: '10px' },
        'bottom-left': { bottom: '10px', left: '10px' },
    };

    return (
        <div
            role="toolbar"
            aria-label="Map controls"
            aria-orientation="vertical"
            style={{
                position: 'absolute',
                ...positionStyles[position],
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                backgroundColor: 'white',
                borderRadius: '4px',
                padding: '5px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            }}
        >
            <button
                onClick={() => onBasemapChange('streets')}
                aria-label="Switch to streets basemap"
                title="Streets Basemap"
                tabIndex={0}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onBasemapChange('streets');
                    }
                }}
            >
                <FaMapMarkedAlt aria-hidden="true" />
            </button>
            <button
                onClick={() => onBasemapChange('satellite')}
                aria-label="Switch to satellite basemap"
                title="Satellite Basemap"
                tabIndex={0}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onBasemapChange('satellite');
                    }
                }}
            >
                <FaLayerGroup aria-hidden="true" />
            </button>
            <button
                onClick={onExportMap}
                aria-label="Export map as image"
                title="Export Map"
                tabIndex={0}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onExportMap();
                    }
                }}
            >
                <FaDownload aria-hidden="true" />
            </button>
            <button
                aria-label="Measure distance on map"
                title="Measure Distance"
                tabIndex={0}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // TODO: Implement measure distance functionality
                    }
                }}
            >
                <FaRuler aria-hidden="true" />
            </button>
            <button
                aria-label="Share map location"
                title="Share Map"
                tabIndex={0}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // TODO: Implement share functionality
                    }
                }}
            >
                <FaShareAlt aria-hidden="true" />
            </button>
        </div>
    );
};

export default MapControls;
