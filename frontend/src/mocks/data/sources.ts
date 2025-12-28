import type { Source } from '@/services/akgda/models/Source';

export const mockSources: Source[] = [
    {
        id: 1,
        sid: 'source-1',
        name: 'OpenStreetMap',
        description: 'OpenStreetMap base tiles',
        source_type: 'vector',
        attritutes: {},
    },
    {
        id: 2,
        sid: 'source-2',
        name: 'Satellite Imagery',
        description: 'High-resolution satellite imagery',
        source_type: 'raster',
        attritutes: {},
    },
];
