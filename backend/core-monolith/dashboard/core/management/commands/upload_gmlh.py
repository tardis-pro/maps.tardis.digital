from django.core.management.base import BaseCommand, CommandError
import csv
import io
from django.contrib.gis.geos import Point
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import transaction
import json


def chunked_bulk_create(model, data, chunk_size=500):
    num_geometries = len(data)

    with transaction.atomic():
        for i in range(0, num_geometries, chunk_size):
            chunk = data[i:i+chunk_size]
            model.objects.bulk_create(chunk)

def parse_json_insert_to_geometry_model(json_file_path, source_id):
    # Read the CSV data from the file
    with open(json_file_path) as f:
        data_list = json.load(f)
        rows = data_list
        geometries = []
        index = 0 
        print(rows) 
    # Upload the CSV data to the Geometry model
    


class Command(BaseCommand):
    help = "Uploads a location geojson to the Geometry model"

    def add_arguments(self, parser):
        parser.add_argument("geojson", type=str, help="The path to the geojson file")
        parser.add_argument("--source-id", type=int, help="The ID of the source")
        parser.add_argument("--geometry-id", type=str, help="The ID of the geometry")

    def handle(self, *args, **options):
        source_id = options.get("source_id", "2")
        geojson = options["geojson"]

        parse_json_insert_to_geometry_model(geojson, source_id)
        self.stdout.write(
            self.style.SUCCESS("Successfully uploaded CSV file to Geometry model")
        )