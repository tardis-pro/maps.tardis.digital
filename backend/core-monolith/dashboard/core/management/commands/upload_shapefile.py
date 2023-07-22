from django.core.management.base import BaseCommand, CommandError
import io
import geopandas as gpd
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import transaction
from django.contrib.gis.geos import GEOSGeometry, WKTWriter
import shapely.geometry
import json

def chunked_bulk_create(model, data, chunk_size=500):
    num_geometries = len(data)
    print(num_geometries)
    for i in range(0, num_geometries, chunk_size):  
        with transaction.atomic():        
            chunk = data[i:i+chunk_size]
            model.objects.bulk_create(chunk)
        print(f'Created {i+chunk_size} of {num_geometries} geometries')

def upload_shapefile_to_geometry_model(shapefile_path, source_id, source_name):
    # Read the shapefile data
    df = gpd.read_file(shapefile_path)
    
    geometries = []
    source, created = Source.objects.get_or_create(sid=source_id, name=source_name, attributes={})
    # Upload the shapefile data to the Geometry model
    # Geometry.objects.all().delete()
    
    keys_to_remove = ['geometry']
    for index, row in df.iterrows():
        geom = row['geometry'].__geo_interface__
        # exit()
        django_geometry = json.dumps(geom)
        geometry_type = row['geometry'].geom_type
        metadata = row.to_dict()
        
        for key in keys_to_remove:
            metadata.pop(key, None)
        geometry = Geometry(
            geom=django_geometry,
            metadata=json.dumps(metadata),
            geometry_type=geometry_type,
            source=source,
        )
        geometries.append(geometry)
    chunked_bulk_create(Geometry, geometries)


class Command(BaseCommand):
    help = "Uploads a shapefile to the Geometry model"

    def add_arguments(self, parser):
        parser.add_argument("shapefile", type=str, help="The path to the shapefile")
        parser.add_argument("--source_id", type=int, help="The ID of the source")
        parser.add_argument("--source_name", type=str, help="The Name of the source")

    def handle(self, *args, **options):
        shapefile_path = options["shapefile"]
        source_id = options.get("source_id", "1")
        source_name = options.get("source_name", "Shapefile")
        upload_shapefile_to_geometry_model(shapefile_path, source_id, source_name)
        self.stdout.write(
            self.style.SUCCESS("Successfully uploaded shapefile to Geometry model")
        )
