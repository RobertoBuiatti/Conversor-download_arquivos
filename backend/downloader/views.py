from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
import re

class DownloadAudioView(APIView):
    """
    API para baixar áudio ou vídeo do YouTube usando yt-dlp.
    """
    def post(self, request):
        import tempfile
        import yt_dlp
        import os

        url = request.data.get('url')
        format_choice = request.data.get('format', 'mp3')

        # Validação de URL do YouTube
        youtube_regex = r'^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$'
        if not url or not re.match(youtube_regex, url):
            return Response({'detail': 'URL do YouTube inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        with tempfile.TemporaryDirectory() as tmpdir:
            # Configuração de formatos
            if format_choice in ['mp3', 'm4a']:
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': f'{tmpdir}/audio.%(ext)s',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': format_choice,
                        'preferredquality': '192',
                    }],
                    'quiet': True,
                }
                exts = [format_choice, 'webm', 'wav']
            elif format_choice in ['mp4', 'webm']:
                ydl_opts = {
                    'format': f'bestvideo[ext={format_choice}]+bestaudio[ext=m4a]/best[ext={format_choice}]',
                    'outtmpl': f'{tmpdir}/video.%(ext)s',
                    'quiet': True,
                }
                exts = [format_choice]
            else:
                return Response({'detail': 'Formato inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                # Procura o arquivo gerado
                for ext in exts:
                    fname = 'audio' if format_choice in ['mp3', 'm4a'] else 'video'
                    file_path = os.path.join(tmpdir, f'{fname}.{ext}')
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as file_obj:
                            response = FileResponse(file_obj, as_attachment=True, filename=f'{fname}.{ext}')
                            return response
                return Response({'detail': 'Arquivo não encontrado após download. Verifique se ffmpeg está instalado.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                if 'ffmpeg' in str(e).lower():
                    return Response({'detail': 'Erro: ffmpeg não está instalado no servidor. Instale ffmpeg para baixar áudio/vídeo.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                return Response({'detail': f'Erro ao baixar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
