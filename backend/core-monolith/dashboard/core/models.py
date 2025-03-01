from django.contrib.gis.db import models
from django.utils.text import slugify
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class Source(models.Model):
    """
    Represents a data source for geographic information.
    
    A source can contain multiple geometries and can be used by multiple layers.
    """
    sid = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=50, db_index=True)
    description = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, db_index=True)
    attributes = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.name} ({self.source_type})"
    
    def save(self, *args, **kwargs):
        """Override save to ensure sid is set and cache is invalidated."""
        if not self.sid:
            self.sid = slugify(self.name)
        super().save(*args, **kwargs)
        # Invalidate cache
        cache.delete(f'source_attributes_{self.id}')
    
    class Meta:
        verbose_name_plural = "Sources"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['source_type']),
        ]
class Geometry(models.Model):
    """
    Represents a geographic geometry with associated metadata.
    
    Each geometry belongs to a source and has a specific geometry type.
    """
    gid = models.BigAutoField(primary_key=True)
    geom = models.GeometryField(spatial_index=True)
    metadata = models.JSONField(default=dict)
    geometry_type = models.CharField(max_length=50, db_index=True)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='geometries')
    
    def __str__(self):
        return f"Geometry {self.gid} ({self.geometry_type}) - {self.source.name}"
    
    class Meta:
        verbose_name_plural = "Geometries" 
        unique_together = ('gid', 'source')
        indexes = [
            models.Index(fields=['geometry_type']),
            models.Index(fields=['source']),
        ]

class Layer(models.Model):
    """
    Represents a map layer with styling and attribute information.
    
    Each layer is associated with a source and can be included in multiple projects.
    """
    lid = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=50, db_index=True)  
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='layers')
    attributes = models.JSONField(default=dict)  # Fixed typo: attritutes -> attributes
    style = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.name} (Source: {self.source.name})"
    
    def save(self, *args, **kwargs):
        """Override save to ensure lid is set."""
        if not self.lid:
            self.lid = slugify(self.name)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Layers"
        indexes = [
            models.Index(fields=['name']),
        ]


class Project(models.Model):
    """
    Represents a map project that can contain multiple layers.
    """
    pid = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=50, db_index=True)
    description = models.CharField(max_length=255)
    project_type = models.CharField(max_length=50, db_index=True)
    layers = models.ManyToManyField(Layer, blank=True, related_name='projects')
    
    def __str__(self):
        return f"{self.name} ({self.project_type})"
    
    def save(self, *args, **kwargs):
        """Override save to ensure pid is set."""
        if not self.pid:
            self.pid = slugify(self.name)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Projects"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['project_type']),
        ]


# Signal handlers for cache invalidation
@receiver(post_save, sender=Geometry)
@receiver(post_delete, sender=Geometry)
def invalidate_source_cache(sender, instance, **kwargs):
    """Invalidate source cache when geometries are changed."""
    cache.delete(f'source_attributes_{instance.source_id}')
