import { http, HttpResponse } from 'msw';
import { mockProjects } from '../data/projects';
import type { Project } from '@/services/akgda/models/Project';

const BASE_URL = 'http://localhost:8000';

const projects = [...mockProjects];
let nextId = Math.max(...projects.map((p) => p.id)) + 1;

export const projectHandlers = [
    // List projects
    http.get(`${BASE_URL}/api/v1/projects/`, () => {
        return HttpResponse.json(projects);
    }),

    // Create project
    http.post(`${BASE_URL}/api/v1/projects/`, async ({ request }) => {
        const body = (await request.json()) as Project;
        const newProject: Project = { ...body, id: nextId++, layers: [] };
        projects.push(newProject);
        return HttpResponse.json(newProject, { status: 201 });
    }),

    // Get project
    http.get(`${BASE_URL}/api/v1/projects/:id/`, ({ params }) => {
        const project = projects.find((p) => p.id === Number(params.id));
        if (!project) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        return HttpResponse.json(project);
    }),

    // Update project
    http.put(
        `${BASE_URL}/api/v1/projects/:id/`,
        async ({ params, request }) => {
            const body = (await request.json()) as Project;
            const index = projects.findIndex((p) => p.id === Number(params.id));
            if (index === -1) {
                return HttpResponse.json(
                    { detail: 'Not found.' },
                    { status: 404 }
                );
            }
            projects[index] = { ...body, id: Number(params.id) };
            return HttpResponse.json(projects[index]);
        }
    ),

    // Patch project
    http.patch(
        `${BASE_URL}/api/v1/projects/:id/`,
        async ({ params, request }) => {
            const body = (await request.json()) as Partial<Project>;
            const index = projects.findIndex((p) => p.id === Number(params.id));
            if (index === -1) {
                return HttpResponse.json(
                    { detail: 'Not found.' },
                    { status: 404 }
                );
            }
            projects[index] = { ...projects[index], ...body };
            return HttpResponse.json(projects[index]);
        }
    ),

    // Delete project
    http.delete(`${BASE_URL}/api/v1/projects/:id/`, ({ params }) => {
        const index = projects.findIndex((p) => p.id === Number(params.id));
        if (index === -1) {
            return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }
        projects.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
    }),
];
