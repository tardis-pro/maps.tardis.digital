import { http, HttpResponse } from 'msw';
import { mockUserDetails } from '../data/users';

const BASE_URL = 'http://localhost:8000';

export const authHandlers = [
    // Login
    http.post(`${BASE_URL}/api/rest-auth/login/`, () => {
        return HttpResponse.json({ key: 'mock-auth-token-12345' });
    }),

    // Logout
    http.post(`${BASE_URL}/api/rest-auth/logout/`, () => {
        return HttpResponse.json({ detail: 'Successfully logged out.' });
    }),

    // Get current user
    http.get(`${BASE_URL}/api/rest-auth/user/`, () => {
        return HttpResponse.json(mockUserDetails);
    }),

    // Update user
    http.put(`${BASE_URL}/api/rest-auth/user/`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...mockUserDetails, ...body });
    }),

    // Patch user
    http.patch(`${BASE_URL}/api/rest-auth/user/`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...mockUserDetails, ...body });
    }),

    // Password change
    http.post(`${BASE_URL}/api/rest-auth/password/change/`, () => {
        return HttpResponse.json({ detail: 'New password has been saved.' });
    }),

    // Password reset
    http.post(`${BASE_URL}/api/rest-auth/password/reset/`, () => {
        return HttpResponse.json({
            detail: 'Password reset e-mail has been sent.',
        });
    }),

    // Registration
    http.post(`${BASE_URL}/api/rest-auth/registration/`, () => {
        return HttpResponse.json({ key: 'mock-auth-token-new-user' });
    }),
];
