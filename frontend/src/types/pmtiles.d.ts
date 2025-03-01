/**
 * Type definitions for pmtiles
 */

declare module 'pmtiles' {
    interface GetResourceResponse<T> {
        data: T;
        cacheControl?: string;
        expires?: string;
    }

    type AddProtocolAction = (params: any, callback: any) => Promise<GetResourceResponse<any>>;

    export class Protocol {
        tile: AddProtocolAction;
        constructor();
    }
}
