import React from 'react';

interface BasemapSelectorProps {
    onChange: (value: string) => void;
}

const BasemapSelector: React.FC<BasemapSelectorProps> = ({ onChange }) => {
    const basemaps = [
        { id: 'streets', name: 'Streets' },
        { id: 'satellite', name: 'Satellite' },
        { id: 'dark', name: 'Dark' },
        { id: 'light', name: 'Light' },
        { id: 'terrain', name: 'Terrain' },
    ];

    return (
        <div>
            <label htmlFor="basemap-select">Basemap:</label>
            <select
                id="basemap-select"
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '5px',
                    marginTop: '5px',
                    borderRadius: '4px',
                }}
            >
                {basemaps.map((basemap) => (
                    <option key={basemap.id} value={basemap.id}>
                        {basemap.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default BasemapSelector;
