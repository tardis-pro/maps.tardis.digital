from django.core.management.base import BaseCommand, CommandError
from core.models import Geometry, Source
from django.db import transaction, connection
from django.core.cache import cache
import json
import logging
import time
from tqdm import tqdm
from django.db.models import Min, Max, Count, F, Func, Value, CharField
from django.db.models.functions import Cast
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models.expressions import RawSQL

# Configure logging
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Updates source statistics and metadata attributes"
    
    def create_update_function(self):
        """Create or replace the PostgreSQL function for updating source attributes."""
        function_sql = """
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
        """
        
        with connection.cursor() as cursor:
            cursor.execute(function_sql)
            logger.info("Created or updated the update_source_attributes database function")
    
    def update_source_attributes(self, source_id):
        """
        Update attributes for a specific source using the database function.
        
        Args:
            source_id: ID of the source to update
        """
        try:
            # Check if source exists
            source = Source.objects.get(id=source_id)
            
            logger.info(f"Updating attributes for source: {source.name} (ID: {source_id})")
            start_time = time.time()
            
            # Call the database function
            with connection.cursor() as cursor:
                cursor.execute("SELECT update_source_attributes(%s)", [source_id])
            
            # Clear cache for this source
            cache.delete(f'source_attributes_{source_id}')
            
            elapsed = time.time() - start_time
            logger.info(f"Updated source attributes in {elapsed:.2f} seconds")
            
            # Fetch and return the updated source
            return Source.objects.get(id=source_id)
        
        except Source.DoesNotExist:
            logger.error(f"Source with ID {source_id} does not exist")
            raise CommandError(f"Source with ID {source_id} does not exist")
        
        except Exception as e:
            logger.error(f"Error updating source attributes: {e}", exc_info=True)
            raise CommandError(f"Failed to update source attributes: {e}")
    
    def update_all_source_attributes(self):
        """Update attributes for all sources."""
        sources = Source.objects.all()
        total = sources.count()
        
        if total == 0:
            logger.info("No sources found to update")
            return
        
        logger.info(f"Updating attributes for {total} sources")
        
        with tqdm(total=total, desc="Updating sources") as pbar:
            for source in sources:
                try:
                    self.update_source_attributes(source.id)
                    pbar.update(1)
                except Exception as e:
                    logger.error(f"Error updating source {source.id}: {e}")
    
    def add_arguments(self, parser):
        parser.add_argument("source_id", nargs='?', default='all', type=str,
                        help="The ID of the source or 'all' to update all sources")
        parser.add_argument("--create-function", action="store_true", 
                        help="Create or update the database function")

    def handle(self, *args, **options):
        try:
            start_time = time.time()
            
            # Create or update the database function if requested
            if options.get("create_function", False):
                self.create_update_function()
            
            source_id = options.get("source_id")
            
            if source_id == 'all':
                self.update_all_source_attributes()
                message = "Successfully updated attributes for all sources"
            else:
                try:
                    source_id = int(source_id)
                    source = self.update_source_attributes(source_id)
                    message = f"Successfully updated attributes for source: {source.name} (ID: {source_id})"
                except ValueError:
                    raise CommandError(f"Invalid source_id: {source_id}. Must be an integer or 'all'")
            
            elapsed = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f"{message} in {elapsed:.2f} seconds"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
            raise
