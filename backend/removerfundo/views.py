from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rembg import remove
from PIL import Image
import io

@csrf_exempt
def remove_background(request):
    if request.method == "POST":
        if "file" not in request.FILES:
            return JsonResponse({"error": "Arquivo não enviado."}, status=400)
        file = request.FILES["file"]
        input_image = Image.open(file)
        output_image = remove(input_image)
        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        buffer.seek(0)
        return HttpResponse(buffer, content_type="image/png")
    return JsonResponse({"error": "Método não permitido."}, status=405)
