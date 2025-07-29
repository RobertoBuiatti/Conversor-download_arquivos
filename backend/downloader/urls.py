from django.urls import path
from .views import DownloadAudioView, PreviewVideoView

urlpatterns = [
    path('download-audio/', DownloadAudioView.as_view(), name='download-audio'),
    path('preview/', PreviewVideoView.as_view(), name='preview-video'),
]
