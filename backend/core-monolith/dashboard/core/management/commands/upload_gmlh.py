from django.core.management.base import BaseCommand, CommandError
import csv
import io
from django.contrib.gis.geos import Point, MultiPolygon
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import transaction
import json
from django.contrib.gis.geos import GEOSGeometry


def chunked_bulk_create(model, data, chunk_size=500):
    num_geometries = len(data)

    with transaction.atomic():
        for i in range(0, num_geometries, chunk_size):
            chunk = data[i:i+chunk_size]
            model.objects.bulk_create(chunk)



def parse_json_insert_to_geometry_model(json_file_path, source_name):
    # Read the CSV data from the file
    with open(json_file_path) as f:
        data_list = json.load(f)
        features = data_list['features']
        geometries = []
        index = 0 
        keys = features[0]['properties'].keys().__str__()
        source, created = Source.objects.get_or_create(name=source_name,attritutes=keys, sid=source_name)
        print(source)
        for row in features:
            #get keys from this properties
            
            
            metadata = row['properties']
            index += 1  
            geometry = Geometry(
                geom=GEOSGeometry(json.dumps(row['geometry'])),
                metadata=metadata,
                geometry_type=row['geometry']['type'],
                source=source,
                gid=f'{source_name}-{index}'
            )
            geometries.append(geometry)
    chunked_bulk_create(Geometry, geometries)
    # Upload the CSV data to the Geometry model
    


class Command(BaseCommand):
    help = "Uploads a location geojson to the Geometry model"

    def add_arguments(self, parser):
        parser.add_argument("geojson", type=str, help="The path to the geojson file")
        parser.add_argument("--source_name", type=str, help="The ID of the source")
        parser.add_argument("--geometry-id", type=str, help="The ID of the geometry")

    def handle(self, *args, **options):
        print(options)
        source_name = options.get("source_name")
        geojson = options["geojson"]

        parse_json_insert_to_geometry_model(geojson, source_name)
        self.stdout.write(
            self.style.SUCCESS("Successfully uploaded geojson to Geometry model")
        )