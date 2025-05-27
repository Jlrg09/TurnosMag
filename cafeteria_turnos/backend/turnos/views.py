from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Turno, Penalizacion
from .serializers import TurnoSerializer, PenalizacionSerializer
from usuarios.models import Usuario
from cafeteria.models import Cafeteria
from qr.models import QRActivo
from django.utils import timezone
from rest_framework.views import APIView
import random
import string
from rest_framework.permissions import AllowAny

from .utils import notificar_cambio_turno

def generar_codigo_turno(longitud=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=longitud))

def cafeteria_esta_abierta(cafeteria):
    # Ahora depende únicamente del campo 'estado'
    return cafeteria.estado and cafeteria.estado.lower() == "abierto"

# Crear turno (estudiante)
class CrearTurnoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        usuario = request.user
        # Permite generación de turno simulado para pruebas
        if request.data.get('qr') == "simulado":
            cafeteria = Cafeteria.objects.first()
            fecha = timezone.localdate()
            if Penalizacion.objects.filter(usuario=usuario, activa=True).exists():
                return Response({'ok': False, 'mensaje': 'Usuario penalizado, no puede generar turno'}, status=status.HTTP_403_FORBIDDEN)
            if not cafeteria_esta_abierta(cafeteria):
                return Response({'ok': False, 'mensaje': 'La cafetería está cerrada'}, status=status.HTTP_400_BAD_REQUEST)
            if Turno.objects.filter(usuario=usuario, fecha=fecha, cafeteria=cafeteria, estado__in=['pendiente', 'entregado', 'penalizado']).exists():
                return Response({'ok': False, 'mensaje': 'Ya tienes un turno para hoy'}, status=status.HTTP_400_BAD_REQUEST)
            # Generar código único alfanumérico
            codigo_generado = generar_codigo_turno()
            while Turno.objects.filter(codigo_turno=codigo_generado).exists():
                codigo_generado = generar_codigo_turno()
            turno = Turno.objects.create(usuario=usuario, cafeteria=cafeteria, fecha=fecha, codigo_turno=codigo_generado)
            notificar_cambio_turno()
            return Response(TurnoSerializer(turno).data)
        
        cafeteria_id = request.data.get('cafeteria_id')
        codigo_qr = request.data.get('codigo_qr')
        fecha = timezone.localdate()

        # Validar QR real
        try:
            qr = QRActivo.objects.get(codigo=codigo_qr, cafeteria_id=cafeteria_id)
            if qr.expiracion < timezone.now():
                return Response({'ok': False, 'mensaje': 'QR expirado'}, status=status.HTTP_400_BAD_REQUEST)
        except QRActivo.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'QR inválido'}, status=status.HTTP_400_BAD_REQUEST)

        if Penalizacion.objects.filter(usuario=usuario, activa=True).exists():
            return Response({'ok': False, 'mensaje': 'Usuario penalizado, no puede generar turno'}, status=status.HTTP_403_FORBIDDEN)

        cafeteria = Cafeteria.objects.get(id=cafeteria_id)
        if not cafeteria_esta_abierta(cafeteria):
            return Response({'ok': False, 'mensaje': 'La cafetería está cerrada'}, status=status.HTTP_400_BAD_REQUEST)

        if Turno.objects.filter(usuario=usuario, fecha=fecha, cafeteria=cafeteria, estado__in=['pendiente', 'entregado', 'penalizado']).exists():
            return Response({'ok': False, 'mensaje': 'Ya tienes un turno para hoy'}, status=status.HTTP_400_BAD_REQUEST)

        codigo_generado = generar_codigo_turno()
        while Turno.objects.filter(codigo_turno=codigo_generado).exists():
            codigo_generado = generar_codigo_turno()
        turno = Turno.objects.create(usuario=usuario, cafeteria=cafeteria, fecha=fecha, codigo_turno=codigo_generado)
        notificar_cambio_turno()
        return Response(TurnoSerializer(turno).data)

# Listar turnos del usuario autenticado
class TurnosUsuarioView(generics.ListAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        return Turno.objects.filter(usuario=usuario).order_by('fecha', 'id')

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
            notificar_cambio_turno()
            return Response(TurnoSerializer(turno).data)
        except Turno.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'Turno no encontrado'}, status=status.HTTP_404_NOT_FOUND)

# Entregar turno (admin)
class EntregarTurnoAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, turno_id):
        try:
            turno = Turno.objects.get(id=turno_id)
            if turno.estado != 'pendiente':
                return Response({'ok': False, 'mensaje': 'No se puede entregar un turno que no está pendiente'}, status=status.HTTP_400_BAD_REQUEST)
            turno.estado = 'entregado'
            turno.reclamado_en = timezone.now()
            turno.save()
            notificar_cambio_turno()
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

# === Turno actual para frontend (API para mostrar y actualizar en tiempo real) ===
class TurnoActualView(APIView):
    permission_classes = [AllowAny]  # <--- Así cualquiera puede acceder

    def get(self, request):
        turno = Turno.objects.filter(estado='pendiente').order_by('fecha', 'id').first()
        if turno:
            data = TurnoSerializer(turno).data
        else:
            data = None
        return Response(data)