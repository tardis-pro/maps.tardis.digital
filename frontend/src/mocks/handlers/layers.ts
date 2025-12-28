import { http, HttpResponse } from 'msw';
import { mockLayers } from '../data/layers';
import type { Layer } from '@/services/akgda/models/Layer';

const BASE_URL = 'http://localhost:8000';

const layers = [...mockLayers];
let nextId = Math.max(...layers.map((l) => l.id)) + 1;

export const layerHandlers = [
    // List layers
    http.get(`${BASE_URL}/api/v1/layers/`, () => {
        return HttpResponse.json(layers);
    }),

    // Create layer
    http.post(`${BASE_URL}/api/v1/layers/`, async ({ request }) => {
        const body = (await request.json()) as Layer;
        const newLayer: Layer = { ...body, id: nextId++ };
        layers.push(newLayer);
        return HttpResponse.json(newLayer, { status: 201 });
    }),

    // Get layer
    http.get(`${BASE_URL}/api/v1/layers/:id/`, ({ params }) => {
        const layer = layers.find((l) => l.id === Number(params.id));
        if (!layer) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        return HttpResponse.json(layer);
    }),

    // Update layer
    http.put(`${BASE_URL}/api/v1/layers/:id/`, async ({ params, request }) => {
        const body = (await request.json()) as Layer;
        const index = layers.findIndex((l) => l.id === Number(params.id));
        if (index === -1) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        layers[index] = { ...body, id: Number(params.id) };
        return HttpResponse.json(layers[index]);
    }),

    // Patch layer
    http.patch(
        `${BASE_URL}/api/v1/layers/:id/`,
        async ({ params, request }) => {
            const body = (await request.json()) as Partial<Layer>;
            const index = layers.findIndex((l) => l.id === Number(params.id));
            if (index === -1) {
                return HttpResponse.json(
                    { detail: 'Not found.' },
                    { status: 404 }
                );
            }
            layers[index] = { ...layers[index], ...body };
            return HttpResponse.json(layers[index]);
        }
    ),

    // Delete layer
    http.delete(`${BASE_URL}/api/v1/layers/:id/`, ({ params }) => {
        const index = layers.findIndex((l) => l.id === Number(params.id));
        if (index === -1) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        layers.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
    }),
];
