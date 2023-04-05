from django.contrib import admin

# Register your models here.
from django.contrib.gis.admin import OSMGeoAdmin
from .models import Geometry, Layer, Source, Project

@admin.register(Source)
class SourceAdmin(OSMGeoAdmin):
    list_display = [ 'description' ]
@admin.register(Layer)
class LayerAdmin(OSMGeoAdmin):
    list_display = [ 'source', 'project'   ]

@admin.register(Project)
class ProjectAdmin(OSMGeoAdmin):
    list_display = [ 'description']

@admin.register(Geometry)
class GeometryAdmin(OSMGeoAdmin):
    default_lon = 0 
    defafult_lat = 0
    default_zoom = 2 
