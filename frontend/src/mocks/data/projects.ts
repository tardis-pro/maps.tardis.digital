import type { Project } from '@/services/akgda/models/Project';
import { mockLayers } from './layers';

export const mockProjects: Project[] = [
    {
        id: 1,
        pid: 'project-1',
        name: 'City Analysis',
        description: 'Urban planning and analysis project',
        project_type: 'analysis',
        layers: mockLayers.slice(0, 2),
    },
    {
        id: 2,
        pid: 'project-2',
        name: 'Environmental Study',
        description: 'Environmental impact assessment',
        project_type: 'environmental',
        layers: [mockLayers[2]],
    },
];
