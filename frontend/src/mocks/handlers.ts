import { authHandlers } from './handlers/auth';
import { layerHandlers } from './handlers/layers';
import { projectHandlers } from './handlers/projects';
import { sourceHandlers } from './handlers/sources';
import { userHandlers } from './handlers/user';

export const handlers = [
    ...authHandlers,
    ...layerHandlers,
    ...projectHandlers,
    ...sourceHandlers,
    ...userHandlers,
];
