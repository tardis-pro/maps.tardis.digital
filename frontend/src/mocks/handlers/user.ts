import { http, HttpResponse } from 'msw';
import { mockUser } from '../data/users';
import type { User } from '@/services/akgda/models/User';

const BASE_URL = 'http://localhost:8000';

let user = { ...mockUser };

export const userHandlers = [
    // Get user profile
    http.get(`${BASE_URL}/api/v1/user-profile/`, () => {
        return HttpResponse.json(user);
    }),

    // Update user profile
    http.put(`${BASE_URL}/api/v1/user-profile/`, async ({ request }) => {
        const body = (await request.json()) as User;
        user = { ...user, ...body };
        return HttpResponse.json(user);
    }),

    // Patch user profile
    http.patch(`${BASE_URL}/api/v1/user-profile/`, async ({ request }) => {
        const body = (await request.json()) as Partial<User>;
        user = { ...user, ...body };
        return HttpResponse.json(user);
    }),

    // WFS endpoint
    http.get(`${BASE_URL}/api/v1/wfs/`, () => {
        return HttpResponse.json({ features: [] });
    }),
];
