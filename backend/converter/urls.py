from django.urls import path
from .views import (
    ConvertWordToPDFView,
    ConvertPDFToWordView,
    MergePDFsView,
    RemovePDFPagesView,
)

urlpatterns = [
    path('word-to-pdf/', ConvertWordToPDFView.as_view(), name='word-to-pdf'),
    path('pdf-to-word/', ConvertPDFToWordView.as_view(), name='pdf-to-word'),
    path('merge-pdfs/', MergePDFsView.as_view(), name='merge-pdfs'),
    path('remove-pdf-pages/', RemovePDFPagesView.as_view(), name='remove-pdf-pages'),
]
