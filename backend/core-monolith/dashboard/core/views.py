from rest_framework import generics, permissions, filters, status
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from dj_rest_auth.views import PasswordResetView
from rest_framework.views import APIView
from django.db import connection
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from rest_framework.pagination import PageNumberPagination
import logging
import time

from core.models import Geometry, Source, Project, Layer
from .serializers import (
    GeometrySerializer, SourceSerializer, ProjectSerializer, 
    LayerSerializer, UserSerializer
)
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

# Configure logging
logger = logging.getLogger(__name__)

class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for list views."""
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class SourceList(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating Sources.
    
    GET: List all sources with pagination
    POST: Create a new source
    """
    queryset = Source.objects.all().order_by('name')
    serializer_class = SourceSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'source_type']
    ordering_fields = ['name', 'source_type']
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        """Override list method to add caching."""
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Override create to log the action."""
        logger.info(f"Creating new source: {serializer.validated_data.get('name')}")
        serializer.save()


class SourceDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a Source.
    
    GET: Retrieve a source
    PUT/PATCH: Update a source
    DELETE: Delete a source
    """
    queryset = Source.objects.all()
    serializer_class = SourceSerializer
    
    def get_object(self):
        """Override to add caching."""
        obj = super().get_object()
        cache_key = f'source_detail_{obj.id}'
        return obj
    
    def perform_update(self, serializer):
        """Override update to invalidate cache."""
        obj = serializer.save()
        cache.delete(f'source_detail_{obj.id}')
        logger.info(f"Updated source: {obj.name} (ID: {obj.id})")
    
    def perform_destroy(self, instance):
        """Override destroy to invalidate cache and log."""
        logger.info(f"Deleting source: {instance.name} (ID: {instance.id})")
        cache.delete(f'source_detail_{instance.id}')
        instance.delete()


class ProjectList(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating Projects.
    
    GET: List all projects with pagination
    POST: Create a new project
    """
    queryset = Project.objects.all().order_by('name')
    serializer_class = ProjectSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'project_type']
    ordering_fields = ['name', 'project_type']
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        """Override list method to add caching."""
        return super().list(request, *args, **kwargs)


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a Project.
    
    GET: Retrieve a project
    PUT/PATCH: Update a project
    DELETE: Delete a project
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    def get_object(self):
        """Override to add caching."""
        obj = super().get_object()
        cache_key = f'project_detail_{obj.id}'
        return obj
    
    def perform_update(self, serializer):
        """Override update to invalidate cache."""
        obj = serializer.save()
        cache.delete(f'project_detail_{obj.id}')
    
    def perform_destroy(self, instance):
        """Override destroy to invalidate cache."""
        cache.delete(f'project_detail_{instance.id}')
        instance.delete()


class LayerList(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating Layers.
    
    GET: List all layers with pagination
    POST: Create a new layer
    """
    queryset = Layer.objects.select_related('source').all().order_by('name')
    serializer_class = LayerSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'source__name']
    ordering_fields = ['name', 'source__name']
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        """Override list method to add caching."""
        return super().list(request, *args, **kwargs)


class LayerDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a Layer.
    
    GET: Retrieve a layer
    PUT/PATCH: Update a layer
    DELETE: Delete a layer
    """
    queryset = Layer.objects.select_related('source').all()
    serializer_class = LayerSerializer
    
    def get_object(self):
        """Override to add caching."""
        obj = super().get_object()
        cache_key = f'layer_detail_{obj.id}'
        return obj
    
    def perform_update(self, serializer):
        """Override update to invalidate cache."""
        obj = serializer.save()
        cache.delete(f'layer_detail_{obj.id}')
    
    def perform_destroy(self, instance):
        """Override destroy to invalidate cache."""
        cache.delete(f'layer_detail_{instance.id}')
        instance.delete()


class GeometryAPIView(APIView):
    """
    API endpoint for retrieving geometries as GeoJSON.
    
    GET: Retrieve geometries for a specific source as GeoJSON
    """
    @extend_schema(
        parameters=[
            OpenApiParameter('source_id', int, OpenApiParameter.QUERY, required=True,
                            description='ID of the source to retrieve geometries for'),
            OpenApiParameter('bbox', str, OpenApiParameter.QUERY, required=False,
                            description='Bounding box in format: minx,miny,maxx,maxy'),
            OpenApiParameter('limit', int, OpenApiParameter.QUERY, required=False,
                            description='Maximum number of features to return'),
        ],
        summary='Get geometries as GeoJSON',
        description='Retrieve geometries for a specific source as a GeoJSON feature collection',
        responses={
            200: OpenApiResponse(description="GeoJSON Feature Collection"),
            400: OpenApiResponse(description="Bad Request - Invalid parameters"),
            404: OpenApiResponse(description="Not Found - Source does not exist"),
        }
    )
    def get(self, request):
        """Get geometries as GeoJSON for a specific source."""
        source_id = request.query_params.get('source_id')
        bbox = request.query_params.get('bbox')
        limit = request.query_params.get('limit', 10000)
        
        if not source_id:
            return Response(
                {"error": "source_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Check if source exists
            source = Source.objects.filter(id=source_id).exists()
            if not source:
                return Response(
                    {"error": f"Source with ID {source_id} does not exist"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Try to get from cache first
            cache_key = f'geojson_{source_id}'
            if bbox:
                cache_key += f'_bbox_{bbox}'
            cache_key += f'_limit_{limit}'
            
            feature_collection = cache.get(cache_key)
            
            if feature_collection is None:
                logger.info(f"Cache miss for {cache_key}, generating GeoJSON")
                start_time = time.time()
                
                # Build the SQL query with parameters
                sql = "SELECT generate_geojson_feature_collection_v3(%s"
                params = [source_id]
                
                if bbox:
                    sql += ", %s"
                    params.append(bbox)
                
                if limit:
                    sql += ", %s"
                    params.append(limit)
                
                sql += ");"
                
                # Execute the query
                with connection.cursor() as cursor:
                    cursor.execute(sql, params)
                    feature_collection = cursor.fetchone()[0]
                
                # Cache the result for 5 minutes
                cache.set(cache_key, feature_collection, 60 * 5)
                
                elapsed = time.time() - start_time
                logger.info(f"Generated GeoJSON in {elapsed:.2f} seconds")
            else:
                logger.info(f"Cache hit for {cache_key}")
            
            return Response(feature_collection)
        
        except Exception as e:
            logger.error(f"Error generating GeoJSON: {e}", exc_info=True)
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating the current user's profile.
    
    GET: Retrieve the current user's profile
    PUT/PATCH: Update the current user's profile
    """
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        """Return the current user."""
        return self.request.user


class CustomPasswordResetView(PasswordResetView):
    """Custom password reset view with improved response."""
    def post(self, request, *args, **kwargs):
        """Handle password reset request."""
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            return Response(
                {"detail": "Password reset e-mail has been sent."}, 
                status=status.HTTP_200_OK
            )
        return response
