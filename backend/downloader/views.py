from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
import re

class PreviewVideoView(APIView):
    """
    API para extrair metadados e restrições de vídeo do YouTube sem baixar.
    """
    def post(self, request):
        import yt_dlp

        url = request.data.get('url')
        youtube_regex = r'^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$'
        if not url or not re.match(youtube_regex, url):
            return Response({'detail': 'URL do YouTube inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
            # Extrai metadados relevantes
            preview = {
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'uploader': info.get('uploader'),
                'is_live': info.get('is_live'),
                'age_limit': info.get('age_limit'),
                'view_count': info.get('view_count'),
                'formats': [
                    {
                        'format_id': f.get('format_id'),
                        'ext': f.get('ext'),
                        'resolution': f.get('resolution'),
                        'abr': f.get('abr'),
                        'vbr': f.get('vbr'),
                        'filesize': f.get('filesize'),
                        'format_note': f.get('format_note'),
                    }
                    for f in info.get('formats', [])
                ],
                'restrictions': {
                    'region_restricted': info.get('region_restricted'),
                    'webpage_url': info.get('webpage_url'),
                    'availability': info.get('availability'),
                    'license': info.get('license'),
                }
            }
            return Response(preview, status=status.HTTP_200_OK)
        except Exception as e:
            if "This video is unavailable" in str(e) or "This content isn’t available" in str(e):
                return Response({'detail': 'Vídeo indisponível ou protegido no YouTube.'}, status=status.HTTP_400_BAD_REQUEST)
            import traceback
            return Response({'detail': f'Erro ao extrair informações: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DownloadAudioView(APIView):
    """
    API para baixar áudio ou vídeo do YouTube usando yt-dlp.
    """
    def post(self, request):
        import tempfile
        import yt_dlp
        import os
        import logging

        logger = logging.getLogger("downloader")
        url = request.data.get('url')
        format_choice = request.data.get('format', 'mp3')

        # Validação de URL de vídeo (YouTube, Vimeo, etc.)
        video_regex = r'^(https?\:\/\/)?(www\.youtube\.com|youtu\.be|vimeo\.com|www\.vimeo\.com|dailymotion\.com|www\.dailymotion\.com)\/.+$'
        if not url or not re.match(video_regex, url):
            return Response({'detail': 'URL de vídeo inválida ou não suportada.'}, status=status.HTTP_400_BAD_REQUEST)

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
                logger.error(f"Formato inválido solicitado: {format_choice} | URL: {url}")
                return Response({'detail': 'Formato inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                try:
                    logger.info(f"Tentando download com yt-dlp | URL: {url} | Formato: {format_choice}")
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([url])
                    logger.info(f"Download bem-sucedido com yt-dlp | URL: {url} | Formato: {format_choice}")
                except Exception as e:
                    logger.warning(f"Falha yt-dlp, tentando youtube-dl | URL: {url} | Erro: {str(e)}")
                    if "Video unavailable" in str(e) or "This content isn’t available" in str(e):
                        logger.error(f"Vídeo indisponível/protegido | URL: {url}")
                        return Response({'detail': 'Vídeo indisponível ou protegido no YouTube.'}, status=status.HTTP_400_BAD_REQUEST)
                    try:
                        import youtube_dl
                        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                            ydl.download([url])
                        logger.info(f"Download bem-sucedido com youtube-dl | URL: {url} | Formato: {format_choice}")
                    except Exception as e2:
                        logger.warning(f"Falha youtube-dl, tentando extrator genérico | URL: {url} | Erro: {str(e2)}")
                        # Camada 3: Extrator genérico (apenas para MP4)
                        if format_choice == "mp4":
                            import requests
                            headers = {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
                            }
                            try:
                                r = requests.get(url, headers=headers, stream=True, timeout=30)
                                if r.status_code == 200 and "video" in r.headers.get("Content-Type", ""):
                                    gen_path = os.path.join(tmpdir, "video.mp4")
                                    with open(gen_path, "wb") as f:
                                        for chunk in r.iter_content(chunk_size=8192):
                                            f.write(chunk)
                                    logger.info(f"Download genérico bem-sucedido | URL: {url}")
                                else:
                                    logger.error(f"Extrator genérico falhou | URL: {url} | Status: {r.status_code}")
                                    import traceback
                                    return Response({
                                        'detail': f'Extrator genérico falhou: status {r.status_code}',
                                        'trace': traceback.format_exc()
                                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                            except Exception as e3:
                                logger.error(f"Falha extrator genérico | URL: {url} | Erro: {str(e3)}")
                                import traceback
                                return Response({
                                    'detail': f'Erro ao baixar com yt-dlp, youtube-dl e extrator genérico: {str(e3)}',
                                    'trace': traceback.format_exc()
                                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        else:
                            logger.error(f"Falha youtube-dl e extrator genérico não suportado para formato: {format_choice} | URL: {url}")
                            import traceback
                            return Response({
                                'detail': f'Erro ao baixar com yt-dlp, youtube-dl e extrator genérico: {str(e2)}',
                                'trace': traceback.format_exc()
                            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                # Procura o arquivo gerado
                for ext in exts:
                    fname = 'audio' if format_choice in ['mp3', 'm4a'] else 'video'
                    file_path = os.path.join(tmpdir, f'{fname}.{ext}')
                    if os.path.exists(file_path):
                        logger.info(f"Arquivo encontrado: {file_path} | URL: {url}")
                        with open(file_path, 'rb') as file_obj:
                            response = FileResponse(file_obj, as_attachment=True, filename=f'{fname}.{ext}')
                            return response
                logger.error(f"Arquivo não encontrado após download | URL: {url}")
                return Response({'detail': 'Arquivo não encontrado após download. Verifique se ffmpeg está instalado.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                if 'ffmpeg' in str(e).lower():
                    logger.error(f"ffmpeg não instalado | URL: {url}")
                    return Response({'detail': 'Erro: ffmpeg não está instalado no servidor. Instale ffmpeg para baixar áudio/vídeo.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                logger.error(f"Erro inesperado no download | URL: {url} | Erro: {str(e)}")
                import traceback
                return Response({'detail': f'Erro ao baixar: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
