import React, { useState, useRef } from 'react';
import { Modal, Tabs } from '@mantine/core';
import { FaUpload, FaLink, FaDatabase } from 'react-icons/fa';

interface AddLayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFileUpload: (files: File[]) => void;
    onApiConnect: (url: string) => void;
}

const AddLayerModal: React.FC<AddLayerModalProps> = ({
    isOpen,
    onClose,
    onFileUpload,
    onApiConnect,
}) => {
    const [activeTab, setActiveTab] = useState<string | null>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [apiUrl, setApiUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            onFileUpload(Array.from(e.dataTransfer.files));
            onClose();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            onFileUpload(Array.from(e.target.files));
            onClose();
        }
    };

    const handleApiSubmit = () => {
        if (apiUrl.trim()) {
            onApiConnect(apiUrl.trim());
            setApiUrl('');
            onClose();
        }
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title="Add Layer"
            size="md"
            styles={{
                title: { fontWeight: 600, fontSize: '18px' },
                body: { padding: 0 },
            }}
        >
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab
                        value="upload"
                        leftSection={<FaUpload size={14} />}
                    >
                        Upload
                    </Tabs.Tab>
                    <Tabs.Tab value="api" leftSection={<FaLink size={14} />}>
                        API
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="database"
                        leftSection={<FaDatabase size={14} />}
                    >
                        Database
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="upload" p="md">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--spacing-xl)',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: isDragging
                                ? 'var(--color-accent-light)'
                                : 'var(--color-bg-secondary)',
                            transition: 'all var(--transition-fast)',
                        }}
                    >
                        <FaUpload
                            size={32}
                            style={{
                                color: 'var(--color-text-muted)',
                                marginBottom: 'var(--spacing-md)',
                            }}
                        />
                        <p
                            style={{
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-xs)',
                            }}
                        >
                            Drop files here or click to browse
                        </p>
                        <p
                            style={{
                                color: 'var(--color-text-muted)',
                                fontSize: '12px',
                            }}
                        >
                            GeoJSON, CSV, TIF, PNG supported
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".geojson,.json,.csv,.tif,.tiff,.png,.jpg"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                </Tabs.Panel>

                <Tabs.Panel value="api" p="md">
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-md)',
                        }}
                    >
                        <label
                            style={{
                                fontSize: '14px',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            API Endpoint URL
                        </label>
                        <input
                            type="url"
                            placeholder="https://example.com/api/data.geojson"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            style={{
                                padding: 'var(--spacing-md)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '14px',
                            }}
                        />
                        <button
                            onClick={handleApiSubmit}
                            disabled={!apiUrl.trim()}
                            style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: apiUrl.trim()
                                    ? 'var(--color-accent)'
                                    : 'var(--color-bg-tertiary)',
                                color: apiUrl.trim()
                                    ? 'white'
                                    : 'var(--color-text-muted)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: apiUrl.trim()
                                    ? 'pointer'
                                    : 'not-allowed',
                                fontWeight: 500,
                            }}
                        >
                            Connect
                        </button>
                    </div>
                </Tabs.Panel>

                <Tabs.Panel value="database" p="md">
                    <div
                        style={{
                            padding: 'var(--spacing-xl)',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        <FaDatabase
                            size={32}
                            style={{
                                marginBottom: 'var(--spacing-md)',
                                opacity: 0.5,
                            }}
                        />
                        <p>Database connections coming soon</p>
                    </div>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
};

export default AddLayerModal;
