import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaEllipsisV, FaSearch } from 'react-icons/fa';

export interface Layer {
    id: string | number;
    name: string;
    visible: boolean;
    type?: string;
}

interface LayerListProps {
    layers: Layer[];
    onToggleVisibility: (layerId: string | number) => void;
    onLayerSelect: (layerId: string | number) => void;
    onAddLayer: () => void;
    selectedLayerId?: string | number | null;
}

const LayerList: React.FC<LayerListProps> = ({
    layers,
    onToggleVisibility,
    onLayerSelect,
    onAddLayer,
    selectedLayerId,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLayers = layers.filter((layer) =>
        layer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            {/* Search */}
            <div
                style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        gap: 'var(--spacing-sm)',
                    }}
                >
                    <FaSearch
                        size={12}
                        style={{ color: 'var(--color-text-muted)' }}
                    />
                    <input
                        type="text"
                        placeholder="Search layers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            border: 'none',
                            background: 'none',
                            outline: 'none',
                            flex: 1,
                            fontSize: '13px',
                            color: 'var(--color-text-primary)',
                        }}
                    />
                </div>
            </div>

            {/* Layer list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredLayers.map((layer) => (
                    <div
                        key={layer.id}
                        onClick={() => onLayerSelect(layer.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            cursor: 'pointer',
                            backgroundColor:
                                selectedLayerId === layer.id
                                    ? 'var(--color-accent-light)'
                                    : 'transparent',
                            borderLeft:
                                selectedLayerId === layer.id
                                    ? '3px solid var(--color-accent)'
                                    : '3px solid transparent',
                        }}
                        className="hover:bg-gray-50"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleVisibility(layer.id);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 'var(--spacing-xs)',
                                cursor: 'pointer',
                                color: layer.visible
                                    ? 'var(--color-accent)'
                                    : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {layer.visible ? (
                                <FaEye size={14} />
                            ) : (
                                <FaEyeSlash size={14} />
                            )}
                        </button>
                        <span
                            style={{
                                flex: 1,
                                marginLeft: 'var(--spacing-sm)',
                                fontSize: '14px',
                                color: 'var(--color-text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {layer.name}
                        </span>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 'var(--spacing-xs)',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            className="hover:text-gray-600"
                        >
                            <FaEllipsisV size={12} />
                        </button>
                    </div>
                ))}
                {filteredLayers.length === 0 && (
                    <div
                        style={{
                            padding: 'var(--spacing-xl)',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                            fontSize: '13px',
                        }}
                    >
                        {searchQuery
                            ? 'No layers match your search'
                            : 'No layers added yet'}
                    </div>
                )}
            </div>

            {/* Add layer button */}
            <div
                style={{
                    padding: 'var(--spacing-md)',
                    borderTop: '1px solid var(--color-border)',
                }}
            >
                <button
                    onClick={onAddLayer}
                    style={{
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                    className="hover:opacity-90"
                >
                    + Add Layer
                </button>
            </div>
        </div>
    );
};

export default LayerList;
