from django.urls import path
from .views import remove_background

urlpatterns = [
    path('remove-background/', remove_background, name='remove_background'),
]
