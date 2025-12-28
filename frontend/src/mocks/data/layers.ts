import type { Layer } from '@/services/akgda/models/Layer';

export const mockLayers: Layer[] = [
    {
        id: 1,
        lid: 'layer-1',
        name: 'Buildings',
        attritutes: { type: 'polygon' },
        style: { fillColor: '#3388ff', fillOpacity: 0.5 },
        source: 1,
        geometries: ['Polygon'],
    },
    {
        id: 2,
        lid: 'layer-2',
        name: 'Roads',
        attritutes: { type: 'line' },
        style: { lineColor: '#666666', lineWidth: 2 },
        source: 1,
        geometries: ['LineString'],
    },
    {
        id: 3,
        lid: 'layer-3',
        name: 'Points of Interest',
        attritutes: { type: 'point' },
        style: { circleColor: '#ff0000', circleRadius: 6 },
        source: 1,
        geometries: ['Point'],
    },
];
