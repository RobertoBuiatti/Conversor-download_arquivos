from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from PIL import Image
import io

@csrf_exempt
def remove_background(request):
    if request.method == "POST":
        if "file" not in request.FILES:
            return JsonResponse({"error": "Arquivo não enviado."}, status=400)
        file = request.FILES["file"]
        input_image = Image.open(file)
        # Importa rembg apenas quando necessário
        from rembg import remove

        # Se o arquivo for muito grande, redimensiona para evitar uso excessivo de memória
        max_width = 512
        max_height = 512
        width, height = input_image.size
        if width > max_width or height > max_height:
            scale = min(max_width / width, max_height / height)
            new_size = (int(width * scale), int(height * scale))
            input_image = input_image.resize(new_size, Image.LANCZOS)
        output_image = remove(input_image)

        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        buffer.seek(0)
        return HttpResponse(buffer, content_type="image/png")
    return JsonResponse({"error": "Método não permitido."}, status=405)
