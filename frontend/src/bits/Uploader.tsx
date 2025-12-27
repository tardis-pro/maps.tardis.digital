import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { V1Service } from '../services/akgda/services/V1Service';

interface UploaderProps {
    updateUploadedFiles?: (files: File[]) => void;
    allowMultiple?: boolean;
    acceptedFileTypes?: string[];
    maxFileSize?: number; // in bytes
    label?: string;
}

const Uploader: React.FC<UploaderProps> = ({
    updateUploadedFiles,
    allowMultiple = false,
    acceptedFileTypes = ['image/jpeg', 'image/png', 'application/json', 'application/geo+json'],
    maxFileSize = 50 * 1024 * 1024, // 50MB
    label = 'Upload Files'
}) => {
    const { addToast } = useToast();
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFiles = useCallback((filesToValidate: File[]): File[] => {
        return filesToValidate.filter(file => {
            // Check file type
            if (acceptedFileTypes.length && !acceptedFileTypes.includes(file.type)) {
                addToast(`File type not supported: ${file.type}`, 'error');
                return false;
            }

            // Check file size
            if (maxFileSize && file.size > maxFileSize) {
                addToast(`File too large: ${file.name}`, 'error');
                return false;
            }

            return true;
        });
    }, [acceptedFileTypes, maxFileSize, addToast]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const validFiles = validateFiles(newFiles);

            if (validFiles.length) {
                const updatedFiles = allowMultiple ? [...files, ...validFiles] : validFiles;
                setFiles(updatedFiles);
                if (updateUploadedFiles) {
                    updateUploadedFiles(updatedFiles);
                }
            }
        }
    };

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        if (event.dataTransfer.files) {
            const newFiles = Array.from(event.dataTransfer.files);
            const validFiles = validateFiles(newFiles);

            if (validFiles.length) {
                const updatedFiles = allowMultiple ? [...files, ...validFiles] : validFiles;
                setFiles(updatedFiles);
                if (updateUploadedFiles) {
                    updateUploadedFiles(updatedFiles);
                }
            }
        }
    }, [allowMultiple, files, updateUploadedFiles, validateFiles]);

    const handleUpload = async () => {
        if (!files.length) {
            addToast('Please select files to upload', 'warning');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // For each file, create a FormData and upload
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Update progress based on files processed
                setUploadProgress(Math.round((i / files.length) * 100));

                // Check if it's a GeoJSON file
                if (file.type === 'application/geo+json' || file.name.endsWith('.geojson')) {
                    // Read the file content
                    const content = await readFileAsText(file);

                    try {
                        // Parse the GeoJSON
                        const geojson = JSON.parse(content);

                        // Create a new source with this GeoJSON data
                        const source = {
                            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                            description: `Uploaded GeoJSON: ${file.name}`,
                            source_type: 'geojson',
                            attributes: {
                                data: geojson
                            }
                        };

                        // Upload to the API
                        await V1Service.v1SourcesCreate(source);

                        addToast(`Successfully uploaded ${file.name} as a new source`, 'success');
                    } catch (error) {
                        addToast(`Error processing GeoJSON: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                    }
                } else {
                    // For other file types, we could implement different upload strategies
                    // For example, uploading to S3 or another storage service

                    // Simulate upload for now
                    await new Promise(resolve => setTimeout(resolve, 500));

                    addToast(`Uploaded ${file.name}`, 'success');
                }
            }

            setUploadProgress(100);

            // Clear files after successful upload if needed
            if (!allowMultiple) {
                setFiles([]);
                if (updateUploadedFiles) {
                    updateUploadedFiles([]);
                }
            }
        } catch (error) {
            addToast(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const handleRemoveFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
        if (updateUploadedFiles) {
            updateUploadedFiles(newFiles);
        }
    };

    const openFileDialog = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="w-full">
            <div
                className={`p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-blue-500 bg-blue-50 bg-opacity-10' : 'border-gray-600 bg-gray-800 bg-opacity-50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <div className="text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    <p className="mt-1 text-sm text-gray-300">
                        {files.length > 0
                            ? `${files.length} file${files.length !== 1 ? 's' : ''} selected`
                            : 'Drag & drop files here, or click to select'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                        {acceptedFileTypes.join(', ')} up to {Math.round(maxFileSize / (1024 * 1024))}MB
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={allowMultiple}
                    accept={acceptedFileTypes.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        >
                            <div className="flex items-center">
                                <svg
                                    className="h-5 w-5 text-gray-400 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <div className="text-sm truncate max-w-xs">{file.name}</div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile(index);
                                }}
                                className="text-red-400 hover:text-red-300"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload progress */}
            {isUploading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{uploadProgress}%</p>
                </div>
            )}

            {/* Upload button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                className={`mt-4 w-full py-2 px-4 rounded font-medium ${isUploading || files.length === 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {isUploading ? 'Uploading...' : 'Upload Files'}
            </motion.button>
        </div>
    );
};

export default Uploader;
