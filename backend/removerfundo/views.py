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

        # Se o arquivo for muito grande, processa por partes
        if input_image.size[0] * input_image.size[1] > 4000 * 4000:
            # Divide a imagem em quadrantes e processa cada um separadamente
            width, height = input_image.size
            quadrants = [
                (0, 0, width // 2, height // 2),
                (width // 2, 0, width, height // 2),
                (0, height // 2, width // 2, height),
                (width // 2, height // 2, width, height)
            ]
            output_image = Image.new("RGBA", input_image.size)
            for box in quadrants:
                region = input_image.crop(box)
                processed = remove(region)
                output_image.paste(processed, box)
        else:
            output_image = remove(input_image)

        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        buffer.seek(0)
        return HttpResponse(buffer, content_type="image/png")
    return JsonResponse({"error": "Método não permitido."}, status=405)
