from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import QRActivo
from .serializers import QRActivoSerializer
from cafeteria.models import Cafeteria
from django.utils import timezone
from rest_framework.views import APIView
from turnos.models import Turno
from usuarios.models import Usuario  # O tu modelo de usuario/estudiante
from cafeteria.models import Cafeteria

class CrearTurnoPublicoView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        codigo_estudiantil = request.data.get('codigo_estudiantil')
        qr_codigo = request.data.get('qr_codigo')
        cafeteria_id = request.data.get('cafeteria_id')

        if codigo_estudiantil:
            try:
                usuario = Usuario.objects.get(codigo_estudiantil=codigo_estudiantil)
                cafeteria = Cafeteria.objects.get(id=cafeteria_id) if cafeteria_id else Cafeteria.objects.first()
            except Usuario.DoesNotExist:
                return Response({'mensaje': 'Código estudiantil no válido.'}, status=400)
            except Cafeteria.DoesNotExist:
                return Response({'mensaje': 'Cafetería no válida.'}, status=400)
            # Crear turno si no tiene uno pendiente
            if Turno.objects.filter(usuario=usuario, estado="pendiente").exists():
                return Response({'mensaje': 'Ya tienes un turno pendiente.'}, status=400)
            turno = Turno.objects.create(usuario=usuario, cafeteria=cafeteria)
            return Response({
                'codigo_turno': turno.codigo_turno,
                'estudiante': usuario.username,
                'cafeteria': cafeteria.nombre,
                'fecha': turno.generado_en
            })

        elif qr_codigo and cafeteria_id:
            ahora = timezone.now()
            try:
                qr = QRActivo.objects.get(codigo=qr_codigo, cafeteria_id=cafeteria_id, expiracion__gt=ahora)
            except QRActivo.DoesNotExist:
                return Response({'mensaje': 'QR no válido o expirado.'}, status=400)
            # Aquí implementa la lógica para obtener el usuario (por ejemplo, por token si es autenticado)
            return Response({'mensaje': 'Funcionalidad para QR debe implementarse según tu lógica.'}, status=400)
        else:
            return Response({'mensaje': 'Debes enviar codigo_estudiantil o qr_codigo y cafeteria_id.'}, status=400)
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