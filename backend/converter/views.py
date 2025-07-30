from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
from django.core.files.storage import default_storage
import tempfile
import os
from rest_framework.response import Response
from rest_framework.views import APIView
import ffmpeg
import tempfile

class HomeView(APIView):
    def get(self, request):
        return Response({"detail": "API Conversor rodando com sucesso."})

class ConvertWordToPDFView(APIView):
    def post(self, request):
        import tempfile
        from docx import Document
        from fpdf import FPDF

        file = request.FILES.get('file')
        if not file or not file.name.endswith(('.doc', '.docx')):
            return Response({'detail': 'Arquivo Word inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_docx:
            temp_docx.write(file.read())
            temp_docx.flush()
            temp_pdf_path = temp_docx.name.replace('.docx', '.pdf')

            try:
                doc = Document(temp_docx.name)
                pdf = FPDF()
                pdf.add_page()
                pdf.set_auto_page_break(auto=True, margin=15)
                pdf.set_font("helvetica", size=12)
                for para in doc.paragraphs:
                    # Remove ou converte caracteres incompatíveis com latin-1
                    safe_text = para.text.encode('latin-1', 'replace').decode('latin-1')
                    pdf.multi_cell(0, 10, safe_text)
                pdf.output(temp_pdf_path)
            except Exception as e:
                import traceback
                return Response({'detail': f'Erro na conversão: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            pdf_file = open(temp_pdf_path, 'rb')
            response = FileResponse(pdf_file, as_attachment=True, filename='convertido.pdf')
            return response

class ConvertPDFToWordView(APIView):
    def post(self, request):
        import tempfile
        try:
            file = request.FILES.get('file')
            if not file or not file.name.endswith('.pdf'):
                return Response({'detail': 'Arquivo PDF inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                temp_pdf.write(file.read())
                temp_pdf.flush()
                temp_docx_path = temp_pdf.name.replace('.pdf', '.docx')

                # Usando pdf2docx (precisa estar instalado)
                try:
                    from pdf2docx import Converter
                    cv = Converter(temp_pdf.name)
                    cv.convert(temp_docx_path, start=0, end=None)
                    cv.close()
                except Exception as e:
                    return Response({'detail': f'Erro na conversão: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                # Abre o arquivo fora do bloco with para evitar fechamento prematuro
                docx_file = open(temp_docx_path, 'rb')
                response = FileResponse(docx_file, as_attachment=True, filename='convertido.docx')
                return response
        except Exception as e:
            return Response({'detail': f'Erro: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MergePDFsView(APIView):
    def post(self, request):
        from pypdf import PdfWriter, PdfReader
        import tempfile

        files = request.FILES.getlist('file')
        if not files or len(files) < 2:
            return Response({'detail': 'Envie pelo menos dois arquivos PDF.'}, status=status.HTTP_400_BAD_REQUEST)

        writer = PdfWriter()
        temp_files = []
        try:
            for f in files:
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                    temp_pdf.write(f.read())
                    temp_pdf.flush()
                    temp_files.append(temp_pdf.name)
                    reader = PdfReader(temp_pdf.name)
                    for page in reader.pages:
                        writer.add_page(page)
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as merged_pdf:
                writer.write(merged_pdf)
                merged_pdf.flush()
                # Abre o arquivo fora do bloco with para evitar fechamento prematuro
                pdf_file = open(merged_pdf.name, 'rb')
                response = FileResponse(pdf_file, as_attachment=True, filename='pdf_unido.pdf')
                return response
        except Exception as e:
            return Response({'detail': f'Erro ao juntar PDFs: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            for path in temp_files:
                try:
                    os.remove(path)
                except Exception:
                    pass

class RemovePDFPagesView(APIView):
    def post(self, request):
        from pypdf import PdfWriter, PdfReader
        import tempfile
        import json

        file = request.FILES.get('file')
        pages = request.data.get('pages')
        if not file or not file.name.endswith('.pdf'):
            return Response({'detail': 'Arquivo PDF inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        if not pages:
            return Response({'detail': 'Informe as páginas para remover.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pages_to_remove = json.loads(pages) if isinstance(pages, str) else pages
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                temp_pdf.write(file.read())
                temp_pdf.flush()
                reader = PdfReader(temp_pdf.name)
                writer = PdfWriter()
                for i, page in enumerate(reader.pages):
                    if i not in pages_to_remove:
                        writer.add_page(page)
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as out_pdf:
                    writer.write(out_pdf)
                    out_pdf.flush()
                    # Abre o arquivo fora do bloco with para evitar fechamento prematuro
                    pdf_file = open(out_pdf.name, 'rb')
                    response = FileResponse(pdf_file, as_attachment=True, filename='pdf_modificado.pdf')
                    return response
        except Exception as e:
            return Response({'detail': f'Erro ao remover páginas: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConvertVideoAudioView(APIView):
    """
    Converte vídeo para áudio ou áudio para vídeo usando ffmpeg-python.
    """
    def post(self, request):
        file = request.FILES.get('file')
        target_format = request.data.get('target_format', 'mp3')
        if not file:
            return Response({'detail': 'Arquivo não enviado.'}, status=status.HTTP_400_BAD_REQUEST)
        allowed_video = ['mp4', 'webm', 'avi', 'mov', 'mkv']
        allowed_audio = ['mp3', 'wav', 'aac', 'm4a', 'ogg']
        ext = file.name.split('.')[-1].lower()
        if ext not in allowed_video + allowed_audio:
            return Response({'detail': 'Formato não suportado.'}, status=status.HTTP_400_BAD_REQUEST)
        if target_format not in allowed_video + allowed_audio:
            return Response({'detail': 'Formato de destino inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as temp_in:
                temp_in.write(file.read())
                temp_in.flush()
                temp_out_path = temp_in.name.replace(f'.{ext}', f'.{target_format}')
                (
                    ffmpeg
                    .input(temp_in.name)
                    .output(temp_out_path)
                    .run(overwrite_output=True)
                )
                out_file = open(temp_out_path, 'rb')
                response = FileResponse(out_file, as_attachment=True, filename=f'convertido.{target_format}')
                return response
        except Exception as e:
            import traceback
            return Response({'detail': f'Erro na conversão: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConvertImageView(APIView):
    """
    Converte imagens entre formatos (jpg, png, webp, etc.) usando Pillow.
    """
    def post(self, request):
        from PIL import Image
        import tempfile

        file = request.FILES.get('file')
        target_format = request.data.get('target_format', 'png')
        allowed_formats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff']
        ext = file.name.split('.')[-1].lower() if file else None

        if not file or ext not in allowed_formats:
            return Response({'detail': 'Formato de imagem não suportado.'}, status=status.HTTP_400_BAD_REQUEST)
        if target_format not in allowed_formats:
            return Response({'detail': 'Formato de destino inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as temp_in:
                temp_in.write(file.read())
                temp_in.flush()
                with Image.open(temp_in.name) as img:
                    temp_out_path = temp_in.name.replace(f'.{ext}', f'.{target_format}')
                    img.save(temp_out_path, format=target_format.upper())
                    out_file = open(temp_out_path, 'rb')
                    response = FileResponse(out_file, as_attachment=True, filename=f'convertido.{target_format}')
                    return response
        except Exception as e:
            import traceback
            return Response({'detail': f'Erro na conversão de imagem: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConvertXMLView(APIView):
    """
    Manipula e converte arquivos XML (validação, conversão para JSON).
    """
    def post(self, request):
        import tempfile
        from lxml import etree
        import json

        file = request.FILES.get('file')
        action = request.data.get('action', 'to_json')  # 'to_json' ou 'validate'
        if not file or not file.name.endswith('.xml'):
            return Response({'detail': 'Arquivo XML inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with tempfile.NamedTemporaryFile(suffix='.xml', delete=False) as temp_xml:
                temp_xml.write(file.read())
                temp_xml.flush()
                tree = etree.parse(temp_xml.name)
                if action == 'validate':
                    # Apenas validação básica
                    return Response({'detail': 'XML válido.'}, status=status.HTTP_200_OK)
                elif action == 'to_json':
                    root = tree.getroot()
                    def xml_to_dict(element):
                        return {
                            element.tag: {
                                'attributes': element.attrib,
                                'text': element.text,
                                'children': [xml_to_dict(child) for child in element]
                            }
                        }
                    data = xml_to_dict(root)
                    return Response({'json': data}, status=status.HTTP_200_OK)
                else:
                    return Response({'detail': 'Ação inválida.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            return Response({'detail': f'Erro ao processar XML: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateReportPDFView(APIView):
    """
    Gera relatório em PDF dos arquivos processados.
    """
    def post(self, request):
        from fpdf import FPDF
        import tempfile
        import datetime

        # Espera receber uma lista de arquivos processados via JSON
        files_data = request.data.get('files')
        if not files_data or not isinstance(files_data, list):
            return Response({'detail': 'Dados dos arquivos ausentes ou inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", size=14)
            pdf.cell(0, 10, "Relatório de Arquivos Processados", ln=True, align="C")
            pdf.set_font("helvetica", size=10)
            pdf.cell(0, 10, f"Data/Hora: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", ln=True)
            pdf.ln(5)
            pdf.set_font("helvetica", size=11)
            for idx, f in enumerate(files_data, 1):
                pdf.cell(0, 8, f"{idx}. Nome: {f.get('name', '-')}", ln=True)
                pdf.cell(0, 8, f"   Tipo: {f.get('type', '-')}", ln=True)
                pdf.cell(0, 8, f"   Status: {f.get('status', '-')}", ln=True)
                pdf.cell(0, 8, f"   Tamanho: {f.get('size', '-')} bytes", ln=True)
                pdf.cell(0, 8, f"   Data/Hora: {f.get('datetime', '-')}", ln=True)
                pdf.ln(2)
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                pdf.output(temp_pdf.name)
                temp_pdf.flush()
                pdf_file = open(temp_pdf.name, 'rb')
                response = FileResponse(pdf_file, as_attachment=True, filename='relatorio_arquivos.pdf')
                return response
        except Exception as e:
            import traceback
            return Response({'detail': f'Erro ao gerar relatório PDF: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import uuid

from rest_framework.parsers import MultiPartParser, FormParser

class RemoveBackgroundView(APIView):
    """
    Remove o fundo de uma imagem enviada via POST.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Arquivo não enviado.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            import tempfile
            from rembg import remove
            from PIL import Image

            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_in:
                temp_in.write(file.read())
                temp_in.flush()
                input_image = Image.open(temp_in.name)
                output_image = remove(input_image)
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_out:
                    output_image.save(temp_out.name, format='PNG')
                    temp_out.flush()
                    out_file = open(temp_out.name, 'rb')
                    response = FileResponse(out_file, as_attachment=True, filename='imagem-sem-fundo.png')
                    return response
        except Exception as e:
            import traceback
            return Response({'detail': f'Erro ao remover fundo: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AsyncUploadView(APIView):
    """
    Upload assíncrono de arquivos grandes. Retorna um ID para acompanhamento.
    """
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Arquivo não enviado.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_id = str(uuid.uuid4())
            save_path = os.path.join('uploads', f'{file_id}_{file.name}')
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)
            # Aqui seria disparado o processamento assíncrono (ex: Celery)
            return Response({'file_id': file_id, 'detail': 'Upload realizado com sucesso. Processamento iniciado.'}, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            import traceback
            return Response({'detail': f'Erro no upload assíncrono: {str(e)}', 'trace': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
