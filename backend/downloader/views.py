from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class DownloadAudioView(APIView):
    def post(self, request):
        # Recebe um link do YouTube, faz download do áudio e retorna o arquivo
        return Response({'detail': 'Download de áudio do YouTube não implementado'}, status=status.HTTP_501_NOT_IMPLEMENTED)
