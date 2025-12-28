import { MVTLayer } from 'deck.gl';
import { PMTiles, RangeResponse } from 'pmtiles';
import type { Feature } from 'geojson';

// Binary feature collection type (simplified for type compatibility)
interface BinaryFeatureCollection {
    shape: 'binary-feature-collection';
    points?: unknown;
    lines?: unknown;
    polygons?: unknown;
}

type ParsedMvtTile = Feature[] | BinaryFeatureCollection;

interface TileIndex {
    x: number;
    y: number;
    z: number;
}

interface TileLoadProps {
    index: TileIndex;
    signal: AbortSignal;
}

interface LoadOptions {
    mimeType?: string;
    mvt?: {
        coordinates?: string;
        tileIndex?: TileIndex;
        [key: string]: unknown;
    };
    gis?: {
        format?: string;
    };
    fetch?: {
        headers?: Record<string, string>;
    };
    [key: string]: unknown;
}

interface PMTilesLayerInternalState {
    data: string;
    tileJSON: null;
    pmtiles: PMTiles;
    binary?: boolean;
}

type FetchFunction = (
    url: string,
    options: {
        propName: string;
        layer: unknown;
        loadOptions: LoadOptions;
        signal: AbortSignal;
    }
) => Promise<ParsedMvtTile>;

interface LayerProps {
    data: string;
    fetch: FetchFunction;
}

// WeakMap to store PMTiles state outside the class to avoid inheritance issues
const pmtilesStateMap = new WeakMap<object, PMTilesLayerInternalState>();

// Use a workaround for deck.gl's strict type checking

const BaseMVTLayer = MVTLayer as any;

export class PMTilesLayer extends BaseMVTLayer {
    static layerName = 'PMTilesLayer';

    async _updateTileData(): Promise<void> {
        const props = this.props as unknown as LayerProps;
        const data = props.data;
        const tileJSON = null;
        const pmtiles = new PMTiles(data);
        pmtilesStateMap.set(this, { data, tileJSON, pmtiles });
        this.setState({ data, tileJSON });
    }

    getTileData(loadProps: TileLoadProps): Promise<any> {
        const pmtilesState = pmtilesStateMap.get(this);
        if (!pmtilesState) {
            // Return empty features array if state not initialized
            return Promise.resolve([]);
        }
        const { data, binary, pmtiles } = pmtilesState;
        const { index, signal } = loadProps;
        const { x, y, z } = index;
        let loadOptions = (this.getLoadOptions?.() ?? {}) as LoadOptions;
        const props = this.props as unknown as LayerProps;
        const fetchFn = props.fetch;
        const zxyPromise = pmtiles.getZxy(z, x, y);
        return zxyPromise.then((val: RangeResponse | undefined) => {
            if (!val) {
                // Return empty features array if tile not found
                return [] as Feature[];
            }
            const context = this.context as {
                viewport?: { resolution?: number };
            };
            loadOptions = {
                ...loadOptions,
                mimeType: 'application/x-protobuf',
                mvt: {
                    ...loadOptions?.mvt,
                    coordinates: context.viewport?.resolution
                        ? 'wgs84'
                        : 'local',
                    tileIndex: index,
                },
                gis: binary ? { format: 'binary' } : {},
                fetch: {
                    headers: {
                        Range:
                            'bytes=' +
                            val.offset +
                            '-' +
                            (val.offset + val.length - 1),
                    },
                },
            };
            return fetchFn(data, {
                propName: 'data',
                layer: this,
                loadOptions,
                signal,
            });
        });
    }
}

export default PMTilesLayer;
