from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Turno, Penalizacion
from .serializers import TurnoSerializer, PenalizacionSerializer
from usuarios.models import Usuario
from cafeteria.models import Cafeteria
from qr.models import QRActivo
from django.utils import timezone
from rest_framework.views import APIView

# Crear turno (estudiante)
class CrearTurnoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        usuario = request.user
        # Permite generación de turno simulado para pruebas
        if request.data.get('qr') == "simulado":
            # Puedes ajustar el ID de una cafetería de pruebas según convenga
            cafeteria = Cafeteria.objects.first()
            fecha = timezone.now().date()
            # Verificar penalización activa
            if Penalizacion.objects.filter(usuario=usuario, activa=True).exists():
                return Response({'ok': False, 'mensaje': 'Usuario penalizado, no puede generar turno'}, status=status.HTTP_403_FORBIDDEN)
            # Verificar si ya tiene turno hoy
            if Turno.objects.filter(usuario=usuario, fecha=fecha, cafeteria=cafeteria).exists():
                return Response({'ok': False, 'mensaje': 'Ya tienes un turno para hoy'}, status=status.HTTP_400_BAD_REQUEST)
            turno = Turno.objects.create(usuario=usuario, cafeteria=cafeteria, fecha=fecha)
            return Response(TurnoSerializer(turno).data)
        
        cafeteria_id = request.data.get('cafeteria_id')
        codigo_qr = request.data.get('codigo_qr')
        fecha = timezone.now().date()

        # Validar QR real
        try:
            qr = QRActivo.objects.get(codigo=codigo_qr, cafeteria_id=cafeteria_id)
            if qr.expiracion < timezone.now():
                return Response({'ok': False, 'mensaje': 'QR expirado'}, status=status.HTTP_400_BAD_REQUEST)
        except QRActivo.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'QR inválido'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar penalización activa
        if Penalizacion.objects.filter(usuario=usuario, activa=True).exists():
            return Response({'ok': False, 'mensaje': 'Usuario penalizado, no puede generar turno'}, status=status.HTTP_403_FORBIDDEN)

        cafeteria = Cafeteria.objects.get(id=cafeteria_id)

        # Verificar si ya tiene turno hoy
        if Turno.objects.filter(usuario=usuario, fecha=fecha, cafeteria=cafeteria).exists():
            return Response({'ok': False, 'mensaje': 'Ya tienes un turno para hoy'}, status=status.HTTP_400_BAD_REQUEST)

        turno = Turno.objects.create(usuario=usuario, cafeteria=cafeteria, fecha=fecha)
        return Response(TurnoSerializer(turno).data)

# Listar turnos del usuario autenticado
class TurnosUsuarioView(generics.ListAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        return Turno.objects.filter(usuario=usuario).order_by('-fecha')

# Listar todos los turnos (admin)
class TurnosListAdminView(generics.ListAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Turno.objects.all().order_by('-fecha')

# Detalle de un turno (admin)
class TurnoDetailAdminView(generics.RetrieveAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Turno.objects.all()

# Pasar/usar turno (admin)
class PasarTurnoView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, turno_id):
        try:
            turno = Turno.objects.get(id=turno_id)
            if turno.estado != 'pendiente':
                return Response({'ok': False, 'mensaje': 'No se puede pasar un turno que no está pendiente'}, status=status.HTTP_400_BAD_REQUEST)
            turno.estado = 'usado'
            turno.reclamado_en = timezone.now()
            turno.save()
            return Response(TurnoSerializer(turno).data)
        except Turno.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'Turno no encontrado'}, status=status.HTTP_404_NOT_FOUND)

# Eliminar turno (admin)
class TurnoDeleteView(generics.DestroyAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Turno.objects.all()

# Listar penalizaciones del usuario
class PenalizacionesUsuarioView(generics.ListAPIView):
    serializer_class = PenalizacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        return Penalizacion.objects.filter(usuario=usuario, activa=True)

# Listar todas penalizaciones (admin)
class PenalizacionesListAdminView(generics.ListAPIView):
    serializer_class = PenalizacionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Penalizacion.objects.all().order_by('-fecha')

# Eliminar/desactivar penalización (admin)
class PenalizacionDeleteView(generics.DestroyAPIView):
    serializer_class = PenalizacionSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Penalizacion.objects.all()