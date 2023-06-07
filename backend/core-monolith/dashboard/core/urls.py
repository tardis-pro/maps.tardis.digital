from django.urls import path
from . import views

urlpatterns = [
    path('sources/', views.SourceList.as_view(), name='source-list'),
    path('sources/<int:pk>/', views.SourceDetail.as_view(), name='source-detail'),
    path('projects/', views.ProjectList.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.ProjectDetail.as_view(), name='project-detail'),
    path('layers/', views.LayerList.as_view(), name='layer-list'),
    path('layers/<int:pk>/', views.LayerDetail.as_view(), name='layer-detail'),
    path('user-profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('wfs/', views.GeometryAPIView.as_view(), name='wfs'),
]
