from django.core.management.base import BaseCommand, CommandError
import csv
import io
from django.contrib.gis.geos import Point
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import transaction


def chunked_bulk_create(model, data, chunk_size=500):
    num_geometries = len(data)

    with transaction.atomic():
        for i in range(0, num_geometries, chunk_size):
            chunk = data[i:i+chunk_size]
            model.objects.bulk_create(chunk)

def upload_csv_file_to_geometry_model(csv_file_path, source_id):
    # Read the CSV data from the file
    csv_file = default_storage.open(csv_file_path)
    csv_data = csv_file.read().decode("utf-8")
    
    # Parse the CSV data into a list of dictionaries
    csv_reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(csv_reader)
    geometries = []
    index = 0  
    # Upload the CSV data to the Geometry model
    for row in rows:
        source, created = Source.objects.get_or_create(sid=source_id)
        metadata = {
            key: value
            for key, value in row.items()
            if key not in ["Latitude", "Longitude"]
        }
        index += 1  
        if row["Longitude"] != "" and float(row["Latitude"]) != "":
            geometry = Geometry.objects.create(
                geom=Point(float(row["Longitude"]), float(row["Latitude"])),
                metadata=metadata,
                geometry_type="Point",
                source=source,
                gid=f'{source.name}-{index}'
            )
            geometries.append(geometry)
    chunked_bulk_create(Geometry, geometries)


class Command(BaseCommand):
    help = "Uploads a CSV file to the Geometry model"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="The path to the CSV file")
        parser.add_argument("--source-id", type=int, help="The ID of the source")
        parser.add_argument("--geometry-id", type=str, help="The ID of the geometry")

    def handle(self, *args, **options):
        csv_file = options["csv_file"]
        source_id = options.get("source_id", "1")

        upload_csv_file_to_geometry_model(csv_file, source_id)
        self.stdout.write(
            self.style.SUCCESS("Successfully uploaded CSV file to Geometry model")
        )
