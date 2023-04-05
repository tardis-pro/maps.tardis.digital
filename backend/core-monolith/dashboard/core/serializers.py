from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from django.contrib.auth.models import User

from .models import Source, Project, Layer, Geometry

class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = '__all__'

class LayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    layers = LayerSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class GeometrySerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Geometry
        geo_field = 'geom'
        fields = ['gid', 'source_id']

    def get_properties(self, instance, fields):
        properties = super().get_properties(instance, fields)
        properties.update(instance.metadata)
        properties.update({'source': instance.source.name})
        
        return properties