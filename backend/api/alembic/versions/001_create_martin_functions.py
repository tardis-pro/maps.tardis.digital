"""Create Martin and GeoJSON PostgreSQL functions

Revision ID: 001_martin_functions
Revises:
Create Date: 2025-12-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "001_martin_functions"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # TileBBox function for calculating tile bounding boxes
    op.execute("""
        CREATE OR REPLACE FUNCTION TileBBox (z int, x int, y int, srid int = 3857)
        RETURNS geometry
        LANGUAGE plpgsql
        IMMUTABLE PARALLEL SAFE STRICT as
        $function$
        declare
            max numeric := 6378137 * pi();
            res numeric := max * 2 / (2^z);
            bbox geometry;
        begin
            bbox := ST_MakeEnvelope(
                -max + (x * res),
                max - (y * res),
                -max + (x * res) + res,
                max - (y * res) - res,
                3857
            );
            if srid = 3857 then
                return bbox;
            else
                return ST_Transform(bbox, srid);
            end if;
        end;
        $function$;
    """)

    # MVT tile generation function for Martin
    op.execute("""
        CREATE OR REPLACE FUNCTION mvt_tile(z integer, x integer, y integer, query_params json)
        RETURNS bytea
        LANGUAGE plpgsql
        IMMUTABLE PARALLEL SAFE STRICT AS
        $function$
            DECLARE
                mvt bytea;
            BEGIN
            SELECT INTO mvt ST_AsMVT(tile, 'layer', 4096, 'geom')
                FROM (
                SELECT ST_AsMVTGeom (
                    ST_Transform(geom, 3857),
                    TileBBox(z, x, y, 3857),
                    4096, 64, true
                ) as geom, metadata
                FROM public.core_geometry where source_id = (query_params->>'source_id')::int
            ) as tile;
            RETURN mvt;
            END
        $function$;
    """)

    # GeoJSON feature collection generator with bbox filtering
    op.execute("""
        CREATE OR REPLACE FUNCTION generate_geojson_feature_collection_v3(
            source_idq integer,
            bbox text DEFAULT NULL,
            feature_limit integer DEFAULT 10000
        ) RETURNS json AS $$
        DECLARE
            feature_collection json;
            features json[];
            bbox_geom geometry;
            query text;
            params text[];
        BEGIN
            -- Parse bbox if provided
            IF bbox IS NOT NULL THEN
                -- bbox format: minx,miny,maxx,maxy
                bbox_geom := ST_MakeEnvelope(
                    split_part(bbox, ',', 1)::float,
                    split_part(bbox, ',', 2)::float,
                    split_part(bbox, ',', 3)::float,
                    split_part(bbox, ',', 4)::float,
                    4326
                );
            END IF;

            -- Build the query dynamically
            query := 'SELECT json_build_object(
                ''type'', ''FeatureCollection'',
                ''features'', array_agg(feature)
            ) FROM (
                SELECT json_build_object(
                    ''type'', ''Feature'',
                    ''id'', cg.gid,
                    ''geometry'', ST_AsGeoJSON(geom)::json,
                    ''properties'', cg.metadata || jsonb_build_object(
                        ''geometry_type'', cg.geometry_type,
                        ''source_id'', cg.source_id
                    )
                ) AS feature
                FROM core_geometry as cg
                WHERE cg.source_id = $1';

            params := ARRAY[source_idq::text];

            -- Add bbox filter if provided
            IF bbox IS NOT NULL THEN
                query := query || ' AND ST_Intersects(cg.geom, $2)';
                params := params || bbox_geom::text;
            END IF;

            -- Add limit
            query := query || ' LIMIT $' || (array_length(params, 1) + 1)::text;
            params := params || feature_limit::text;

            query := query || ') AS features';

            -- Execute the query
            EXECUTE query USING source_idq, bbox_geom, feature_limit INTO feature_collection;

            -- If no features found, return empty feature collection
            IF feature_collection IS NULL THEN
                feature_collection := json_build_object(
                    'type', 'FeatureCollection',
                    'features', '[]'::json
                );
            END IF;

            RETURN feature_collection;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Get tile coordinates from lat/lon
    op.execute("""
        CREATE OR REPLACE FUNCTION get_tile_coords(lat double precision, lon double precision, z integer)
        RETURNS TABLE (x integer, y integer) AS $$
        BEGIN
            RETURN QUERY
            SELECT
                floor((longitude + 180) / (360 / power(2, z)))::integer as x,
                floor((1 - log(tan(radians(latitude)) + 1 / cos(radians(latitude))) / pi()) / (2 / power(2, (z - 1))))::integer as y
            FROM
                (SELECT ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857)) AS longitude,
                        ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857)) AS latitude) AS transformed;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Update source attributes (metadata column stats)
    op.execute("""
        CREATE OR REPLACE FUNCTION update_source_attributes(source_id_param integer)
        RETURNS void AS $$
        DECLARE
            metadata_json jsonb;
            column_names text[];
            col text;
            col_type text;
            numeric_min numeric;
            numeric_max numeric;
            unique_count integer;
            unique_values jsonb;
            result_metadata jsonb := '{}'::jsonb;
        BEGIN
            -- Get all column names from the metadata
            SELECT array_agg(DISTINCT key)
            INTO column_names
            FROM core_geometry, jsonb_each(metadata::jsonb)
            WHERE source_id = source_id_param;

            -- Process each column
            FOREACH col IN ARRAY column_names
            LOOP
                -- Determine column type (numeric or string)
                BEGIN
                    -- Try to cast to numeric to check if it's a number
                    SELECT
                        CASE
                            WHEN COUNT(*) > 0 THEN 'numeric'
                            ELSE 'string'
                        END
                    INTO col_type
                    FROM core_geometry
                    WHERE source_id = source_id_param
                    AND (metadata::jsonb->>col)::text ~ '^-?\\d+(\\.\\d+)?$';

                    -- Get unique count
                    SELECT COUNT(DISTINCT metadata::jsonb->>col)
                    INTO unique_count
                    FROM core_geometry
                    WHERE source_id = source_id_param;

                    -- Process based on type
                    IF col_type = 'numeric' THEN
                        -- Get min and max for numeric columns
                        SELECT
                            MIN((metadata::jsonb->>col)::numeric),
                            MAX((metadata::jsonb->>col)::numeric)
                        INTO numeric_min, numeric_max
                        FROM core_geometry
                        WHERE source_id = source_id_param;

                        result_metadata := result_metadata ||
                            jsonb_build_object(
                                col,
                                jsonb_build_object(
                                    'dtype', 'numeric',
                                    'min', numeric_min,
                                    'max', numeric_max
                                )
                            );
                    ELSE
                        -- For string columns with reasonable cardinality, get unique values
                        IF unique_count < 500 THEN
                            SELECT jsonb_agg(DISTINCT metadata::jsonb->>col)
                            INTO unique_values
                            FROM core_geometry
                            WHERE source_id = source_id_param;

                            result_metadata := result_metadata ||
                                jsonb_build_object(
                                    col,
                                    jsonb_build_object(
                                        'dtype', 'object',
                                        'values', unique_values
                                    )
                                );
                        ELSE
                            -- Just store type for high cardinality columns
                            result_metadata := result_metadata ||
                                jsonb_build_object(
                                    col,
                                    jsonb_build_object('dtype', 'object')
                                );
                        END IF;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    -- If any error, just store as object type
                    result_metadata := result_metadata ||
                        jsonb_build_object(
                            col,
                            jsonb_build_object('dtype', 'object')
                        );
                END;
            END LOOP;

            -- Update the source with the computed metadata
            UPDATE core_source
            SET attributes = result_metadata
            WHERE id = source_id_param;
        END;
        $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS update_source_attributes(integer);")
    op.execute("DROP FUNCTION IF EXISTS get_tile_coords(double precision, double precision, integer);")
    op.execute("DROP FUNCTION IF EXISTS generate_geojson_feature_collection_v3(integer, text, integer);")
    op.execute("DROP FUNCTION IF EXISTS mvt_tile(integer, integer, integer, json);")
    op.execute("DROP FUNCTION IF EXISTS TileBBox(int, int, int, int);")
