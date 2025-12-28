import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLayers } from '../api/queries/layers';
import { useLayerUI } from '../context/LayerUIContext';

interface CatalogItem {
    id: string;
    name: string;
    description?: string;
    type: string;
}

// Component to display the catalog of available data sources
const CatalogDial: React.FC = () => {
    // Use React Query for layers data
    const { data: layers = [], isLoading, error } = useLayers();
    // Use LayerUI context for active layers
    const { activeLayers, toggleLayerVisibility } = useLayerUI();

    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null
    );
    const [, setNotification] = useState<{
        message: string;
        type: 'info' | 'error';
    } | null>(null);

    // Fetch catalog data
    useEffect(() => {
        const fetchCatalog = async () => {
            setIsLoadingCatalog(true);
            try {
                // Try to fetch from the catalog endpoint
                const response = await fetch('http://localhost:3000/catalog');
                const data = await response.json();

                if (data.tiles) {
                    // Transform the data into a more usable format
                    const items: CatalogItem[] = Object.keys(data.tiles).map(
                        (key) => ({
                            id: key,
                            name: key.split('/').pop() || key,
                            type: 'tile',
                        })
                    );

                    setCatalogItems(items);
                }
            } catch (err) {
                console.error('Error fetching catalog data:', err);
                setNotification({
                    message: 'Failed to load catalog data',
                    type: 'error',
                });

                // Fallback to using the layers from the API
                if (layers.length > 0) {
                    const items: CatalogItem[] = layers.map((layer) => ({
                        id: layer.lid || String(layer.id),
                        name: layer.name,
                        description: `Source ID: ${layer.source}`,
                        type: 'layer',
                    }));

                    setCatalogItems(items);
                }
            } finally {
                setIsLoadingCatalog(false);
            }
        };

        fetchCatalog();
    }, [layers]);

    // Filter items based on search term and category
    const filteredItems = catalogItems.filter((item) => {
        const matchesSearch =
            !searchTerm ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description &&
                item.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()));

        const matchesCategory =
            !selectedCategory || item.type === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Get unique categories
    const categories = Array.from(
        new Set(catalogItems.map((item) => item.type))
    );

    // Handle item selection
    const handleItemClick = (item: CatalogItem) => {
        if (item.type === 'layer') {
            toggleLayerVisibility(item.id);
        } else {
            // For tile sources, we might want to add them as a new layer
            setNotification({
                message: `Selected ${item.name}`,
                type: 'info',
            });
        }
    };

    if (isLoading || isLoadingCatalog) {
        return (
            <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900 bg-opacity-50 rounded-lg shadow-lg text-white">
                <h3 className="text-lg font-semibold mb-2">Error</h3>
                <p>
                    {error instanceof Error
                        ? error.message
                        : 'An error occurred'}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg text-white h-full overflow-auto">
            <h2 className="text-xl font-bold mb-4">Data Catalog</h2>

            {/* Search and filter */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    className={`px-3 py-1 rounded text-sm ${!selectedCategory ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </button>
                {categories.map((category) => (
                    <button
                        key={category}
                        className={`px-3 py-1 rounded text-sm ${selectedCategory === category ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Items list */}
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <motion.div
                            key={item.id}
                            className={`p-3 rounded cursor-pointer ${
                                activeLayers.has(item.id)
                                    ? 'bg-blue-700'
                                    : 'bg-gray-700'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                                <div className="text-sm text-gray-300">
                                    {item.description}
                                </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                                Type: {item.type}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-4 text-gray-400">
                        No items found. Try adjusting your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogDial;
