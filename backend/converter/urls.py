from django.urls import path
from .views import (
    ConvertWordToPDFView,
    ConvertPDFToWordView,
    MergePDFsView,
    RemovePDFPagesView,
    ConvertVideoAudioView,
    ConvertImageView,
    ConvertXMLView,
    GenerateReportPDFView,
    AsyncUploadView,
    RemoveBackgroundView,
)

urlpatterns = [
    path('word-to-pdf/', ConvertWordToPDFView.as_view(), name='word-to-pdf'),
    path('pdf-to-word/', ConvertPDFToWordView.as_view(), name='pdf-to-word'),
    path('merge-pdfs/', MergePDFsView.as_view(), name='merge-pdfs'),
    path('remove-pdf-pages/', RemovePDFPagesView.as_view(), name='remove-pdf-pages'),
    path('video-audio/', ConvertVideoAudioView.as_view(), name='video-audio'),
    path('image/', ConvertImageView.as_view(), name='image-convert'),
    path('xml/', ConvertXMLView.as_view(), name='xml-convert'),
    path('report-pdf/', GenerateReportPDFView.as_view(), name='report-pdf'),
    path('async-upload/', AsyncUploadView.as_view(), name='async-upload'),
    path('remove-background/', RemoveBackgroundView.as_view(), name='remove-background'),
]
