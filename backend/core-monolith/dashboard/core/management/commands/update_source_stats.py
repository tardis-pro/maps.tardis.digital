
from django.core.management.base import BaseCommand, CommandError
import csv
import io
from django.contrib.gis.geos import Point, MultiPolygon
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import transaction
import json
from django.contrib.gis.geos import GEOSGeometry

import pandas as pd




class Command(BaseCommand):
    help = "Uploads a location geojson to the Geometry model"

    def update_source_attributes(self, source_id):
        geomList = Geometry.objects.filter(source_id=source_id).values_list('metadata', flat=True)
        df = pd.DataFrame(geomList)
        metadata = {}

# Iterate over the columns
        for column in df.columns:
            # Get the data type of the column
            dtype = str(df[column].dtype)
            
            # Initialize a dictionary for this column
            column_metadata = {'dtype': dtype}
            unique_counts = df[column].nunique()

# Print the counts
            print(unique_counts)
            # If the data type is numeric, get the min and max
            if 'int' in dtype or 'float' in dtype:
                column_metadata['min'] = df[column].min()
                column_metadata['max'] = df[column].max()
            
            # If the data type is object (string), get the unique values
            elif dtype == 'object':
                if(unique_counts < 500):
                    column_metadata['values'] = df[column].unique().tolist()
                

            # Add the metadata for this column to the main metadata dictionary
            metadata[column] = column_metadata

        # Convert the metadata dictionary to a JSON string

        source_model_instance = Source.objects.get(id=source_id)
        source_model_instance.attributes = metadata
        source_model_instance.save()

        pass

    def add_arguments(self, parser):
        parser.add_argument("source_id", type=str,
                            help="The ID of the source")

    def handle(self, *args, **options):
        print(options)
        source_id = options.get("source_id")

        self.update_source_attributes(source_id)
        self.stdout.write(
            self.style.SUCCESS(
                "Successfully uploaded geojson to Geometry model")
        )
