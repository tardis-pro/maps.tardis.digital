from django.core.management.base import BaseCommand, CommandError
import io
import geopandas as gpd
from core.models import Geometry, Source
from django.core.files.storage import default_storage
from django.db import transaction, connection
from django.contrib.gis.geos import GEOSGeometry
import shapely.geometry
import json
import logging
import time
from tqdm import tqdm
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.core.cache import cache

# Configure logging
logger = logging.getLogger(__name__)

def chunked_bulk_create(model, data, chunk_size=1000, source_name=None):
    """
    Efficiently create model instances in chunks with progress tracking.
    
    Args:
        model: Django model class
        data: List of model instances to create
        chunk_size: Number of instances to create in each transaction
        source_name: Name of the source for logging purposes
    """
    num_geometries = len(data)
    logger.info(f"Creating {num_geometries} geometries for source: {source_name}")
    
    start_time = time.time()
    created_count = 0
    
    # Use tqdm for progress tracking
    with tqdm(total=num_geometries, desc="Uploading geometries") as pbar:
        for i in range(0, num_geometries, chunk_size):
            chunk_end = min(i + chunk_size, num_geometries)
            with transaction.atomic():
                chunk = data[i:chunk_end]
                model.objects.bulk_create(chunk)
            
            created_count += len(chunk)
            pbar.update(len(chunk))
            
            # Log progress every 10 chunks or at the end
            if i % (chunk_size * 10) == 0 or chunk_end == num_geometries:
                elapsed = time.time() - start_time
                rate = created_count / elapsed if elapsed > 0 else 0
                logger.info(f"Created {created_count} of {num_geometries} geometries ({rate:.1f} geometries/sec)")
    
    total_time = time.time() - start_time
    logger.info(f"Completed creating {num_geometries} geometries in {total_time:.2f} seconds")
    return created_count

def prepare_geometry_batch(batch_data, source, keys_to_remove):
    """
    Process a batch of geometry data in a separate thread.
    
    Args:
        batch_data: DataFrame batch to process
        source: Source model instance
        keys_to_remove: List of keys to remove from metadata
    
    Returns:
        List of prepared Geometry instances
    """
    geometries = []
    
    for _, row in batch_data.iterrows():
        try:
            # Get geometry in GeoJSON format directly
            geom = row['geometry']
            
            # Handle different geometry types efficiently
            if geom is None:
                continue
                
            # Convert to GeoJSON format
            django_geometry = json.dumps(geom.__geo_interface__)
            geometry_type = geom.geom_type
            
            # Create metadata dictionary without geometry
            metadata = row.drop('geometry').to_dict()
            
            # Remove specified keys
            for key in keys_to_remove:
                metadata.pop(key, None)
            
            # Create Geometry instance
            geometry = Geometry(
                geom=django_geometry,
                metadata=metadata,  # Store as dict, Django will serialize to JSON
                geometry_type=geometry_type,
                source=source,
            )
            geometries.append(geometry)
        except Exception as e:
            logger.error(f"Error processing row: {e}")
    
    return geometries

def upload_shapefile_to_geometry_model(shapefile_path, source_id, source_name, description=None, source_type="shapefile"):
    """
    Upload a shapefile to the Geometry model with optimized processing.
    
    Args:
        shapefile_path: Path to the shapefile
        source_id: ID for the source
        source_name: Name for the source
        description: Optional description for the source
        source_type: Type of the source (default: "shapefile")
    
    Returns:
        Tuple of (source, count of geometries created)
    """
    start_time = time.time()
    
    # Validate file exists
    if not os.path.exists(shapefile_path):
        raise CommandError(f"Shapefile not found: {shapefile_path}")
    
    logger.info(f"Reading shapefile: {shapefile_path}")
    
    try:
        # Read the shapefile data with optimized settings
        df = gpd.read_file(shapefile_path)
        logger.info(f"Shapefile contains {len(df)} features")
        
        # Create or get source
        source_attrs = {
            'name': source_name,
            'attributes': {},
            'source_type': source_type
        }
        
        if description:
            source_attrs['description'] = description
            
        source, created = Source.objects.get_or_create(
            sid=source_id, 
            defaults=source_attrs
        )
        
        if created:
            logger.info(f"Created new source: {source_name} (ID: {source_id})")
        else:
            logger.info(f"Using existing source: {source_name} (ID: {source_id})")
        
        # Keys to remove from metadata
        keys_to_remove = ['geometry', 'master_timestamp']
        
        # Process in parallel for large datasets
        geometries = []
        batch_size = 5000  # Size of each batch for parallel processing
        
        if len(df) > 10000:  # Only use parallel processing for large datasets
            logger.info("Using parallel processing for large dataset")
            batches = [df.iloc[i:i+batch_size] for i in range(0, len(df), batch_size)]
            
            with ThreadPoolExecutor(max_workers=min(os.cpu_count(), 4)) as executor:
                futures = [executor.submit(prepare_geometry_batch, batch, source, keys_to_remove) for batch in batches]
                
                for future in as_completed(futures):
                    try:
                        batch_geometries = future.result()
                        geometries.extend(batch_geometries)
                    except Exception as e:
                        logger.error(f"Error in batch processing: {e}")
        else:
            # For smaller datasets, process in a single thread
            geometries = prepare_geometry_batch(df, source, keys_to_remove)
        
        # Create geometries in database
        count = chunked_bulk_create(Geometry, geometries, chunk_size=1000, source_name=source_name)
        
        # Update source attributes
        logger.info("Updating source attributes...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT update_source_attributes(%s)", [source.id])
        
        # Clear cache for this source
        cache.delete(f'source_attributes_{source.id}')
        
        total_time = time.time() - start_time
        logger.info(f"Total processing time: {total_time:.2f} seconds")
        
        return source, count
    except Exception as e:
        logger.error(f"Error uploading shapefile: {e}", exc_info=True)
        raise CommandError(f"Failed to upload shapefile: {e}")


class Command(BaseCommand):
    help = "Uploads a shapefile to the Geometry model with optimized processing"

    def add_arguments(self, parser):
        parser.add_argument("shapefile", type=str, help="The path to the shapefile")
        parser.add_argument("--source_id", type=str, help="The ID of the source")
        parser.add_argument("--source_name", type=str, help="The name of the source")
        parser.add_argument("--description", type=str, help="Description of the source")
        parser.add_argument("--source_type", type=str, default="shapefile", help="Type of the source")
        parser.add_argument("--chunk_size", type=int, default=1000, help="Chunk size for bulk operations")

    def handle(self, *args, **options):
        shapefile_path = options["shapefile"]
        source_id = options.get("source_id", "1")
        source_name = options.get("source_name", "Shapefile")
        description = options.get("description", f"Imported from {shapefile_path}")
        source_type = options.get("source_type", "shapefile")
        
        try:
            start_time = time.time()
            source, count = upload_shapefile_to_geometry_model(
                shapefile_path, 
                source_id, 
                source_name,
                description,
                source_type
            )
            elapsed = time.time() - start_time
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully uploaded {count} geometries from shapefile to Geometry model in {elapsed:.2f} seconds"
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Source: {source.name} (ID: {source.id})"
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
            raise
