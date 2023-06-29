from django.contrib.gis.db import models



class Source(models.Model):
    sid = models.CharField(max_length=50, unique=True, auto_created=True)
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=50)
    source_type = models.CharField(max_length=50)
    attributes = models.JSONField()
    def __str__(self):
        return self.name
    
    
    class Meta:
        verbose_name_plural = "Sources"


class Geometry(models.Model):
    gid = models.BigAutoField(primary_key=True)
    geom = models.GeometryField()
    metadata = models.JSONField()
    geometry_type = models.CharField(max_length=50)
    source = models.ForeignKey(Source, on_delete=models.CASCADE)
    def __str__(self):
        return self.source
    def __hasattr__(self):
        return self.source
    class Meta:
        verbose_name_plural = "Geometries"  

# Create your models here.
class Layer(models.Model):
    lid = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=50)  
    source = models.ForeignKey(Source, on_delete=models.CASCADE)
    attritutes = models.JSONField()
    style = models.JSONField()
    geometries = models.ManyToManyField(Geometry, blank=True)
    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Layers"


class Project(models.Model):
    pid = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=50)
    project_type = models.CharField(max_length=50)
    layers = models.ManyToManyField(Layer, blank=True)
    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Projects" 