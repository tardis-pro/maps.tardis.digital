/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Layer = {
    readonly id: number;
    lid: string;
    name: string;
    attritutes: Record<string, any>;
    style: Record<string, any>;
    source: number;
    geometries?: Array<string>;
};

