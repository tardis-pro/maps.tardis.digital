/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Layer } from './Layer';

export type Project = {
    readonly id: number;
    readonly layers: Array<Layer>;
    pid: string;
    name: string;
    description: string;
    project_type: string;
};

