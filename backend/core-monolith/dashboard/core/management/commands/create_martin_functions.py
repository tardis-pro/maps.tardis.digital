from django.core.management.base import BaseCommand, CommandError
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import connection


class Command(BaseCommand):
    help = "Creates needed martin and geojson functions"

    def handle(self, *args, **options):
        source_name = f"public.mvt_tile"

        tilebox_query = """CREATE OR REPLACE FUNCTION TileBBox (z int, x int, y int, srid int = 3857)
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
"""

        martin_function_query = f"""CREATE OR REPLACE FUNCTION mvt_tile(z integer, x integer, y integer, query_params json)
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
                                    $function$;"""

        geojson_feature_collection = """CREATE OR REPLACE FUNCTION generate_geojson_feature_collection_v3(source_idq integer) RETURNS json AS $$
                                        DECLARE
                                            feature_collection json;
                                            features json[];
                                        BEGIN
                                            SELECT json_build_object(
                                                'type', 'FeatureCollection',
                                                'features', array_agg(feature)
                                            ) INTO feature_collection as fc
                                            FROM (
                                                SELECT json_build_object(
                                                    'type', 'Feature',
                                                    'id', cg.gid,
                                                    'geometry', ST_AsGeoJSON(geom)::json,
                                                    'properties', cg.metadata || jsonb_build_object(
                                                        'geometry_type', cg.geometry_type,
                                                        'source_id', cg.source_id
                                                    )
                                                ) AS feature
                                                FROM core_geometry as cg where cg.source_id = source_idq
                                            ) AS features;
                                            
                                            RETURN feature_collection;
                                        END;
                                        $$ LANGUAGE plpgsql;"""



        get_tile_coords='''CREATE OR REPLACE FUNCTION get_tile_coords(lat double precision, lon double precision, z integer)
                            RETURNS TABLE (x integer, y integer) AS $$
                            BEGIN
                                RETURN QUERY
                                SELECT
                                    floor((longitude + 180) / (360 / power(2, z))) as x,
                                    floor((1 - log(tan(radians(latitude)) + 1 / cos(radians(latitude))) / pi()) / (2 / power(2, (z - 1)))) as y
                                FROM
                                    (SELECT ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857)) AS longitude,
                                            ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857)) AS latitude) AS transformed;
                            END;
                            $$ LANGUAGE plpgsql;'''

        with connection.cursor() as cursor:
            cursor.execute(tilebox_query)
            cursor.execute(martin_function_query)
            cursor.execute(geojson_feature_collection)
            cursor.execute(get_tile_coords) 
        self.stdout.write(
            self.style.SUCCESS("Creates needed martin and geojson functions")
        )
