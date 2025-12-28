/**
 * Type definitions for pmtiles
 */

declare module 'pmtiles' {
    export interface RangeResponse {
        data: ArrayBuffer;
        etag?: string;
        expires?: string;
        cacheControl?: string;
        offset: number;
        length: number;
    }

    export interface Source {
        getBytes: (
            offset: number,
            length: number,
            signal?: AbortSignal,
            etag?: string
        ) => Promise<RangeResponse>;
        getKey: () => string;
    }

    export interface Header {
        specVersion: number;
        rootDirectoryOffset: number;
        rootDirectoryLength: number;
        jsonMetadataOffset: number;
        jsonMetadataLength: number;
        leafDirectoryOffset: number;
        leafDirectoryLength?: number;
        tileDataOffset: number;
        tileDataLength?: number;
        numAddressedTiles: number;
        numTileEntries: number;
        numTileContents: number;
        clustered: boolean;
        minZoom: number;
        maxZoom: number;
        minLon: number;
        minLat: number;
        maxLon: number;
        maxLat: number;
        centerZoom: number;
        centerLon: number;
        centerLat: number;
        etag?: string;
    }

    export interface Cache {
        getHeader: (source: Source) => Promise<Header>;
        getDirectory: (
            source: Source,
            offset: number,
            length: number,
            header: Header
        ) => Promise<Entry[]>;
        invalidate: (source: Source) => Promise<void>;
    }

    export interface Entry {
        tileId: number;
        offset: number;
        length: number;
        runLength: number;
    }

    export type DecompressFunc = (
        buf: ArrayBuffer,
        compression: number
    ) => Promise<ArrayBuffer>;

    export class PMTiles {
        source: Source;
        cache: Cache;
        decompress: DecompressFunc;
        constructor(
            source: Source | string,
            cache?: Cache,
            decompress?: DecompressFunc
        );
        getHeader(): Promise<Header>;
        getZxy(
            z: number,
            x: number,
            y: number,
            signal?: AbortSignal
        ): Promise<RangeResponse | undefined>;
        getMetadata(): Promise<unknown>;
        getTileJson(baseTilesUrl: string): Promise<unknown>;
    }

    interface GetResourceResponse<T> {
        data: T;
        cacheControl?: string;
        expires?: string;
    }

    type AddProtocolAction = (
        params: unknown,
        callback: unknown
    ) => Promise<GetResourceResponse<unknown>>;

    export class Protocol {
        tiles: Map<string, PMTiles>;
        metadata: boolean;
        errorOnMissingTile: boolean;
        tile: AddProtocolAction;
        constructor(options?: {
            metadata?: boolean;
            errorOnMissingTile?: boolean;
        });
        add(p: PMTiles): void;
        get(url: string): PMTiles | undefined;
    }
}
