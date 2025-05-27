from django.urls import path
from .views import QRActivoCafeteriaView, ValidarQRView, QRHistorialView

urlpatterns = [
    path('actual/', QRActivoCafeteriaView.as_view(), name='qr_activo'),
    path('validar/', ValidarQRView.as_view(), name='validar_qr'),
    path('historial/', QRHistorialView.as_view(), name='qr_historial'),  # Opcional, solo admin
]