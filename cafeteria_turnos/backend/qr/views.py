from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import QRActivo
from .serializers import QRActivoSerializer
from cafeteria.models import Cafeteria
from django.utils import timezone
from rest_framework.views import APIView

# Obtener el QR vigente para una cafetería
class QRActivoCafeteriaView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cafeteria_id = request.query_params.get('cafeteria_id')
        if not cafeteria_id:
            return Response({'error': 'cafeteria_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        ahora = timezone.now()
        try:
            qr = QRActivo.objects.filter(cafeteria_id=cafeteria_id, expiracion__gt=ahora).latest('generado_en')
            data = QRActivoSerializer(qr).data
            return Response(data)
        except QRActivo.DoesNotExist:
            return Response({'error': 'No hay QR activo'}, status=status.HTTP_404_NOT_FOUND)

# Validar un QR escaneado por el usuario
class ValidarQRView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        codigo = request.data.get('codigo')
        cafeteria_id = request.data.get('cafeteria_id')
        if not codigo or not cafeteria_id:
            return Response({'error': 'codigo y cafeteria_id son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        ahora = timezone.now()
        try:
            qr = QRActivo.objects.get(codigo=codigo, cafeteria_id=cafeteria_id)
            if qr.expiracion < ahora:
                return Response({'valido': False, 'mensaje': 'QR expirado'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'valido': True, 'cafeteria': qr.cafeteria.nombre})
        except QRActivo.DoesNotExist:
            return Response({'valido': False, 'mensaje': 'QR no válido'}, status=status.HTTP_400_BAD_REQUEST)

# (Opcional) Listar historial de QRs generados por cafetería (solo admin)
class QRHistorialView(generics.ListAPIView):
    serializer_class = QRActivoSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        cafeteria_id = self.request.query_params.get('cafeteria_id')
        if cafeteria_id:
            return QRActivo.objects.filter(cafeteria_id=cafeteria_id).order_by('-generado_en')
        return QRActivo.objects.none()