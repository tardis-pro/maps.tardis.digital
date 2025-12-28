import { http, HttpResponse } from 'msw';
import { mockSources } from '../data/sources';
import type { Source } from '@/services/akgda/models/Source';

const BASE_URL = 'http://localhost:8000';

const sources = [...mockSources];
let nextId = Math.max(...sources.map((s) => s.id)) + 1;

export const sourceHandlers = [
    // Catalog endpoint (TiTiler-style catalog)
    http.get('http://localhost:3000/catalog', () => {
        return HttpResponse.json({
            tiles: {
                'satellite/imagery': {
                    name: 'Satellite Imagery',
                    type: 'raster',
                },
                'terrain/elevation': { name: 'Elevation Data', type: 'raster' },
                'boundaries/admin': {
                    name: 'Administrative Boundaries',
                    type: 'vector',
                },
            },
        });
    }),

    // List sources
    http.get(`${BASE_URL}/api/v1/sources/`, () => {
        return HttpResponse.json(sources);
    }),

    // Create source
    http.post(`${BASE_URL}/api/v1/sources/`, async ({ request }) => {
        const body = (await request.json()) as Source;
        const newSource: Source = { ...body, id: nextId++ };
        sources.push(newSource);
        return HttpResponse.json(newSource, { status: 201 });
    }),

    // Get source
    http.get(`${BASE_URL}/api/v1/sources/:id/`, ({ params }) => {
        const source = sources.find((s) => s.id === Number(params.id));
        if (!source) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        return HttpResponse.json(source);
    }),

    // Update source
    http.put(`${BASE_URL}/api/v1/sources/:id/`, async ({ params, request }) => {
        const body = (await request.json()) as Source;
        const index = sources.findIndex((s) => s.id === Number(params.id));
        if (index === -1) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        sources[index] = { ...body, id: Number(params.id) };
        return HttpResponse.json(sources[index]);
    }),

    // Patch source
    http.patch(
        `${BASE_URL}/api/v1/sources/:id/`,
        async ({ params, request }) => {
            const body = (await request.json()) as Partial<Source>;
            const index = sources.findIndex((s) => s.id === Number(params.id));
            if (index === -1) {
                return HttpResponse.json(
                    { detail: 'Not found.' },
                    { status: 404 }
                );
            }
            sources[index] = { ...sources[index], ...body };
            return HttpResponse.json(sources[index]);
        }
    ),

    // Delete source
    http.delete(`${BASE_URL}/api/v1/sources/:id/`, ({ params }) => {
        const index = sources.findIndex((s) => s.id === Number(params.id));
        if (index === -1) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        sources.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
    }),
];
