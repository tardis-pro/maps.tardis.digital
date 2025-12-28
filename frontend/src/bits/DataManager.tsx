import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Type definitions for file data
interface GeoJSONFeature {
    type: string;
    properties: Record<string, unknown> | null;
    geometry: unknown;
}

interface GeoJSONData {
    type: string;
    features: GeoJSONFeature[];
}

type CSVData = Record<string, string>[];

interface RasterData {
    url: string;
}

// Dataset type definition (previously from Redux)
export interface Dataset {
    id: string;
    name: string;
    type: 'geojson' | 'csv' | 'raster' | 'vector';
    properties: Record<string, { type: string }>;
    data?: GeoJSONData | CSVData | RasterData;
    sourceUrl?: string;
}

// File type helpers
const isGeoJSON = (file: File) =>
    file.name.endsWith('.geojson') || file.name.endsWith('.json');
const isCSV = (file: File) => file.name.endsWith('.csv');
const isRaster = (file: File) =>
    file.name.endsWith('.tif') ||
    file.name.endsWith('.tiff') ||
    file.name.endsWith('.jpg') ||
    file.name.endsWith('.png');

const DataManager: React.FC = () => {
    // Local state for datasets (previously from Redux)
    const [datasets, setDatasets] = useState<Dataset[]>([]);

    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        [key: string]: number;
    }>({});
    const [selectedTab, setSelectedTab] = useState<'file' | 'api' | 'database'>(
        'file'
    );
    const [apiUrl, setApiUrl] = useState('');
    const [databaseConfig, setDatabaseConfig] = useState({
        host: '',
        port: '',
        username: '',
        password: '',
        database: '',
        query: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    // Process files
    const handleFiles = async (files: File[]) => {
        for (const file of files) {
            try {
                // Set initial progress
                setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

                // Process file based on type
                let data: GeoJSONData | CSVData | RasterData | null = null;
                let properties: Record<string, { type: string }> = {};
                let fileType: Dataset['type'] = 'geojson';

                if (isGeoJSON(file)) {
                    const geoData = await readGeoJSON(file, (progress) => {
                        setUploadProgress((prev) => ({
                            ...prev,
                            [file.name]: progress,
                        }));
                    });
                    data = geoData;

                    // Extract properties from first feature
                    if (geoData.features && geoData.features.length > 0) {
                        Object.entries(
                            geoData.features[0].properties || {}
                        ).forEach(([key, value]) => {
                            properties[key] = { type: typeof value };
                        });
                    }

                    fileType = 'geojson';
                } else if (isCSV(file)) {
                    const csvData = await readCSV(file, (progress) => {
                        setUploadProgress((prev) => ({
                            ...prev,
                            [file.name]: progress,
                        }));
                    });
                    data = csvData;

                    // Extract column headers as properties
                    if (csvData.length > 0) {
                        Object.keys(csvData[0]).forEach((key) => {
                            properties[key] = { type: typeof csvData[0][key] };
                        });
                    }

                    fileType = 'csv';
                } else if (isRaster(file)) {
                    // In a real implementation, you'd process raster files here
                    // For now, we'll just create a placeholder
                    data = { url: URL.createObjectURL(file) };
                    properties = {
                        width: { type: 'number' },
                        height: { type: 'number' },
                        bands: { type: 'number' },
                    };

                    fileType = 'raster';
                } else {
                    // Unsupported file type
                    console.warn(`Unsupported file type: ${file.name}`);
                    setUploadProgress((prev) => {
                        const newProgress = { ...prev };
                        delete newProgress[file.name];
                        return newProgress;
                    });
                    continue;
                }

                // Create dataset object
                const dataset: Dataset = {
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    type: fileType,
                    properties,
                    data,
                };

                // Add to local state
                setDatasets((prev) => [...prev, dataset]);

                // Clear progress after a delay
                setTimeout(() => {
                    setUploadProgress((prev) => {
                        const newProgress = { ...prev };
                        delete newProgress[file.name];
                        return newProgress;
                    });
                }, 1000);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                setUploadProgress((prev) => {
                    const newProgress = { ...prev };
                    delete newProgress[file.name];
                    return newProgress;
                });
            }
        }
    };

    // Read GeoJSON file
    const readGeoJSON = (
        file: File,
        onProgress: (progress: number) => void
    ): Promise<GeoJSONData> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round(
                        (event.loaded / event.total) * 100
                    );
                    onProgress(progress);
                }
            };

            reader.onload = (e) => {
                try {
                    const result = e.target?.result as string;
                    const json = JSON.parse(result);
                    onProgress(100);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);

            reader.readAsText(file);
        });
    };

    // Read CSV file
    const readCSV = (
        file: File,
        onProgress: (progress: number) => void
    ): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round(
                        (event.loaded / event.total) * 100
                    );
                    onProgress(progress);
                }
            };

            reader.onload = (e) => {
                try {
                    const result = e.target?.result as string;
                    const rows = result.split('\n');
                    const headers = rows[0].split(',').map((h) => h.trim());

                    const data = rows
                        .slice(1)
                        .filter((row) => row.trim())
                        .map((row) => {
                            const values = row.split(',').map((v) => v.trim());
                            return headers.reduce(
                                (obj, header, index) => {
                                    obj[header] = values[index];
                                    return obj;
                                },
                                {} as Record<string, string>
                            );
                        });

                    onProgress(100);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);

            reader.readAsText(file);
        });
    };

    // Handle API connection
    const handleAPIConnect = async () => {
        if (!apiUrl) return;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            const properties: Record<string, { type: string }> = {};
            let dataType: Dataset['type'] = 'geojson';

            // Determine if it's GeoJSON
            if (
                data.type === 'FeatureCollection' &&
                Array.isArray(data.features)
            ) {
                // Extract properties from first feature
                if (data.features.length > 0) {
                    Object.entries(data.features[0].properties || {}).forEach(
                        ([key, value]) => {
                            properties[key] = { type: typeof value };
                        }
                    );
                }
                dataType = 'geojson';
            } else {
                // Assume it's generic JSON
                if (Array.isArray(data) && data.length > 0) {
                    Object.entries(data[0]).forEach(([key, value]) => {
                        properties[key] = { type: typeof value };
                    });
                }
            }

            // Create dataset
            const dataset: Dataset = {
                id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: new URL(apiUrl).pathname.split('/').pop() || 'API Data',
                type: dataType,
                properties,
                sourceUrl: apiUrl,
                data,
            };

            // Add to local state
            setDatasets((prev) => [...prev, dataset]);

            // Reset form
            setApiUrl('');
        } catch (error) {
            console.error('Error fetching API data:', error);
            // Show error notification - would be added in a full implementation
        }
    };

    // Handle database connection - stub for now
    const handleDatabaseConnect = () => {
        // This would connect to a database in a real implementation
        console.log('Database connection with:', databaseConfig);
        // Reset form
        setDatabaseConfig({
            host: '',
            port: '',
            username: '',
            password: '',
            database: '',
            query: '',
        });
    };

    // Handle dataset removal
    const handleRemoveDataset = (id: string) => {
        setDatasets((prev) => prev.filter((d) => d.id !== id));
    };

    return (
        <motion.div
            className="data-manager"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="data-manager-header">
                <h2>Data Manager</h2>
                <div className="tabs">
                    <button
                        className={`tab ${selectedTab === 'file' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('file')}
                    >
                        File Upload
                    </button>
                    <button
                        className={`tab ${selectedTab === 'api' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('api')}
                    >
                        API Connection
                    </button>
                    <button
                        className={`tab ${selectedTab === 'database' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('database')}
                    >
                        Database
                    </button>
                </div>
            </div>

            <div className="data-manager-content">
                {/* File Upload */}
                {selectedTab === 'file' && (
                    <div className="upload-section">
                        <div
                            className={`drop-zone ${isDragging ? 'active' : ''}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="drop-icon">
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 16V8M12 8L9 11M12 8L15 11"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <p>Drag & drop files here or click to browse</p>
                            <span className="supported-formats">
                                Supported formats: GeoJSON, CSV, TIF, JPG, PNG
                            </span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                                multiple
                                accept=".geojson,.json,.csv,.tif,.tiff,.jpg,.png"
                            />
                        </div>

                        {/* Upload Progress */}
                        {Object.keys(uploadProgress).length > 0 && (
                            <div className="upload-progress">
                                <h4>Uploading Files</h4>
                                {Object.entries(uploadProgress).map(
                                    ([fileName, progress]) => (
                                        <div
                                            key={fileName}
                                            className="progress-item"
                                        >
                                            <div className="file-info">
                                                <span className="file-name">
                                                    {fileName}
                                                </span>
                                                <span className="progress-value">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* API Connection */}
                {selectedTab === 'api' && (
                    <div className="api-section">
                        <div className="form-group">
                            <label htmlFor="api-url">API URL</label>
                            <input
                                type="text"
                                id="api-url"
                                placeholder="https://example.com/api/data.json"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                            />
                        </div>
                        <button
                            className="connect-btn"
                            onClick={handleAPIConnect}
                            disabled={!apiUrl}
                        >
                            Connect to API
                        </button>
                    </div>
                )}

                {/* Database Connection */}
                {selectedTab === 'database' && (
                    <div className="database-section">
                        <div className="form-group">
                            <label htmlFor="db-host">Host</label>
                            <input
                                type="text"
                                id="db-host"
                                placeholder="localhost"
                                value={databaseConfig.host}
                                onChange={(e) =>
                                    setDatabaseConfig({
                                        ...databaseConfig,
                                        host: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="db-port">Port</label>
                                <input
                                    type="text"
                                    id="db-port"
                                    placeholder="5432"
                                    value={databaseConfig.port}
                                    onChange={(e) =>
                                        setDatabaseConfig({
                                            ...databaseConfig,
                                            port: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="db-name">Database</label>
                                <input
                                    type="text"
                                    id="db-name"
                                    placeholder="postgres"
                                    value={databaseConfig.database}
                                    onChange={(e) =>
                                        setDatabaseConfig({
                                            ...databaseConfig,
                                            database: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="db-username">Username</label>
                                <input
                                    type="text"
                                    id="db-username"
                                    placeholder="postgres"
                                    value={databaseConfig.username}
                                    onChange={(e) =>
                                        setDatabaseConfig({
                                            ...databaseConfig,
                                            username: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="db-password">Password</label>
                                <input
                                    type="password"
                                    id="db-password"
                                    placeholder="********"
                                    value={databaseConfig.password}
                                    onChange={(e) =>
                                        setDatabaseConfig({
                                            ...databaseConfig,
                                            password: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="db-query">SQL Query</label>
                            <textarea
                                id="db-query"
                                rows={3}
                                placeholder="SELECT * FROM spatial_table"
                                value={databaseConfig.query}
                                onChange={(e) =>
                                    setDatabaseConfig({
                                        ...databaseConfig,
                                        query: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <button
                            className="connect-btn"
                            onClick={handleDatabaseConnect}
                            disabled={
                                !databaseConfig.host || !databaseConfig.database
                            }
                        >
                            Connect to Database
                        </button>
                    </div>
                )}

                {/* Imported Datasets */}
                <div className="datasets-section">
                    <h3>Imported Datasets ({datasets.length})</h3>
                    <div className="datasets-list">
                        {datasets.map((dataset) => (
                            <div key={dataset.id} className="dataset-card">
                                <div className="dataset-header">
                                    <div className="dataset-title">
                                        <div className="dataset-type-icon">
                                            {dataset.type === 'geojson' && 'GJ'}
                                            {dataset.type === 'csv' && 'CSV'}
                                            {dataset.type === 'raster' && 'R'}
                                            {dataset.type === 'vector' && 'V'}
                                        </div>
                                        <h4>{dataset.name}</h4>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() =>
                                            handleRemoveDataset(dataset.id)
                                        }
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="dataset-info">
                                    <div className="dataset-properties">
                                        <span>
                                            Properties:{' '}
                                            {
                                                Object.keys(dataset.properties)
                                                    .length
                                            }
                                        </span>
                                        {dataset.type === 'geojson' &&
                                            dataset.data &&
                                            'features' in dataset.data && (
                                                <span>
                                                    Features:{' '}
                                                    {
                                                        (
                                                            dataset.data as GeoJSONData
                                                        ).features.length
                                                    }
                                                </span>
                                            )}
                                        {dataset.type === 'csv' &&
                                            dataset.data &&
                                            Array.isArray(dataset.data) && (
                                                <span>
                                                    Rows:{' '}
                                                    {
                                                        (
                                                            dataset.data as CSVData
                                                        ).length
                                                    }
                                                </span>
                                            )}
                                    </div>
                                    <div className="dataset-source">
                                        {dataset.sourceUrl ? (
                                            <span title={dataset.sourceUrl}>
                                                API Source
                                            </span>
                                        ) : (
                                            <span>File Upload</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {datasets.length === 0 && (
                            <p className="empty-state">
                                No datasets imported yet. Use the tools above to
                                add data.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DataManager;
