from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
from django.core.files.storage import default_storage
import tempfile
import os
from rest_framework.response import Response
from rest_framework.views import APIView

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
                    pdf.multi_cell(0, 10, para.text)
                pdf.output(temp_pdf_path)
            except Exception as e:
                return Response({'detail': f'Erro na conversão: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
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
