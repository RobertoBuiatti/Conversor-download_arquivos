from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
from django.core.files.storage import default_storage
import tempfile
import os

class ConvertWordToPDFView(APIView):
    def post(self, request):
        # Recebe arquivo Word, converte para PDF e retorna o PDF
        # Implementação real será feita depois
        return Response({'detail': 'Conversão Word para PDF não implementada'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class ConvertPDFToWordView(APIView):
    def post(self, request):
        # Recebe arquivo PDF, converte para Word e retorna o DOCX
        return Response({'detail': 'Conversão PDF para Word não implementada'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class MergePDFsView(APIView):
    def post(self, request):
        # Recebe múltiplos PDFs, junta e retorna o PDF final
        return Response({'detail': 'Juntar PDFs não implementado'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class RemovePDFPagesView(APIView):
    def post(self, request):
        # Recebe PDF e lista de páginas para remover, retorna PDF modificado
        return Response({'detail': 'Remover páginas de PDF não implementado'}, status=status.HTTP_501_NOT_IMPLEMENTED)
