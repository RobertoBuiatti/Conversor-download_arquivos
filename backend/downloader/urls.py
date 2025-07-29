from django.urls import path
from .views import DownloadAudioView

urlpatterns = [
    path('download-audio/', DownloadAudioView.as_view(), name='download-audio'),
]
