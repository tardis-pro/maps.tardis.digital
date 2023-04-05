from rest_framework import generics
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from dj_rest_auth.views import PasswordResetView
from rest_framework.views import APIView
from django.db import connection

from core.models import Geometry
from .serializers import GeometrySerializer
from .models import Source, Project, Layer
from .serializers import SourceSerializer, ProjectSerializer, LayerSerializer, UserSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter

class SourceList(generics.ListCreateAPIView):
    queryset = Source.objects.all()
    serializer_class = SourceSerializer

class SourceDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Source.objects.all()
    serializer_class = SourceSerializer

class ProjectList(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class LayerList(generics.ListCreateAPIView):
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer

class LayerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer

class GeometryAPIView(APIView):
     @extend_schema(
        parameters=[
            OpenApiParameter('source_id', str, OpenApiParameter.QUERY),
        ],
        summary='List my models',
        description='Retrieve a list of MyModel objects',
    )
     def get(self, request):
        source_id = request.query_params.get('source_id')
        with connection.cursor() as cursor:
                cursor.execute(f"SELECT generate_geojson_feature_collection_v3({source_id});")
                feature_collection = cursor.fetchone()[0]
        return Response(feature_collection)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class CustomPasswordResetView(PasswordResetView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return Response({"detail": "Password reset e-mail has been sent."})
        return response