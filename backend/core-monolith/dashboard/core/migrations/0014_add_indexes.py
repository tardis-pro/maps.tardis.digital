# Generated manually

from django.db import migrations, models
import django.contrib.postgres.indexes


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_alter_geometry_unique_together'),
    ]

    operations = [
        # Add GIN index for metadata JSONB field
        migrations.AddIndex(
            model_name='geometry',
            index=django.contrib.postgres.indexes.GinIndex(fields=['metadata'], name='geometry_metadata_gin'),
        ),
        
        # Add spatial index for geometry field (if not already created)
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS geometry_geom_gist ON core_geometry USING GIST (geom);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS geometry_geom_gist;
            """
        ),
        
        # Add index for geometry_type field
        migrations.AddIndex(
            model_name='geometry',
            index=models.Index(fields=['geometry_type'], name='geometry_type_idx'),
        ),
        
        # Add index for source_id field
        migrations.AddIndex(
            model_name='geometry',
            index=models.Index(fields=['source'], name='geometry_source_idx'),
        ),
        
        # Add indexes for Source model
        migrations.AddIndex(
            model_name='source',
            index=models.Index(fields=['name'], name='source_name_idx'),
        ),
        migrations.AddIndex(
            model_name='source',
            index=models.Index(fields=['source_type'], name='source_type_idx'),
        ),
        
        # Add indexes for Layer model
        migrations.AddIndex(
            model_name='layer',
            index=models.Index(fields=['name'], name='layer_name_idx'),
        ),
        
        # Add indexes for Project model
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['name'], name='project_name_idx'),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['project_type'], name='project_type_idx'),
        ),
        
        # Add GIN indexes for JSONField fields
        migrations.AddIndex(
            model_name='source',
            index=django.contrib.postgres.indexes.GinIndex(fields=['attributes'], name='source_attributes_gin'),
        ),
        migrations.AddIndex(
            model_name='layer',
            index=django.contrib.postgres.indexes.GinIndex(fields=['attributes'], name='layer_attributes_gin'),
        ),
        migrations.AddIndex(
            model_name='layer',
            index=django.contrib.postgres.indexes.GinIndex(fields=['style'], name='layer_style_gin'),
        ),
    ]
