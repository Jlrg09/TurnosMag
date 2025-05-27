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

from .utils import notificar_cambio_turno, usuario_penalizado, penalizar_turnos_no_reclamados

def generar_codigo_turno(longitud=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=longitud))

def cafeteria_esta_abierta(cafeteria):
    return cafeteria.estado and cafeteria.estado.lower() == "abierto"

# Crear turno (estudiante autenticado)
class CrearTurnoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        usuario = request.user
        if request.data.get('qr') == "simulado":
            cafeteria = Cafeteria.objects.first()
            fecha = timezone.localdate()
            if usuario_penalizado(usuario):
                return Response({'ok': False, 'mensaje': 'Usuario penalizado, no puede generar turno'}, status=status.HTTP_403_FORBIDDEN)
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

        cafeteria_id = request.data.get('cafeteria_id')
        codigo_qr = request.data.get('codigo_qr')
        fecha = timezone.localdate()

        try:
            qr = QRActivo.objects.get(codigo=codigo_qr, cafeteria_id=cafeteria_id)
            if qr.expiracion < timezone.now():
                return Response({'ok': False, 'mensaje': 'QR expirado'}, status=status.HTTP_400_BAD_REQUEST)
        except QRActivo.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'QR inválido'}, status=status.HTTP_400_BAD_REQUEST)

        if usuario_penalizado(usuario):
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

# NUEVA VISTA PÚBLICA PARA CREAR TURNO SIN AUTENTICACIÓN
class CrearTurnoPublicoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        codigo_estudiantil = request.data.get('codigo_estudiantil')
        if not codigo_estudiantil:
            return Response({'ok': False, 'mensaje': 'Debes proporcionar un código estudiantil'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            usuario = Usuario.objects.get(codigo_estudiantil=codigo_estudiantil)
        except Usuario.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        cafeteria = Cafeteria.objects.first()
        fecha = timezone.localdate()
        if usuario_penalizado(usuario):
            return Response({'ok': False, 'mensaje': 'Usuario penalizado, no puede generar turno'}, status=status.HTTP_403_FORBIDDEN)
        if not cafeteria_esta_abierta(cafeteria):
            return Response({'ok': False, 'mensaje': 'La cafetería está cerrada'}, status=status.HTTP_400_BAD_REQUEST)
        if Turno.objects.filter(usuario=usuario, fecha=fecha, cafeteria=cafeteria, estado__in=['pendiente', 'entregado', 'penalizado']).exists():
            return Response({'ok': False, 'mensaje': 'Ya tienes un turno para hoy'}, status=status.HTTP_400_BAD_REQUEST)
        codigo_generado = generar_codigo_turno()
        while Turno.objects.filter(codigo_turno=codigo_generado).exists():
            codigo_generado = generar_codigo_turno()
        turno = Turno.objects.create(usuario=usuario, cafeteria=cafeteria, fecha=fecha, codigo_turno=codigo_generado)
        notificar_cambio_turno()
        # Incluimos información extra para mostrar en el frontend
        data = TurnoSerializer(turno).data
        data["estudiante"] = usuario.get_full_name() or usuario.username
        data["cafeteria"] = cafeteria.nombre if cafeteria else ""
        return Response(data)

class TurnosUsuarioView(generics.ListAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        return Turno.objects.filter(usuario=usuario).order_by('fecha', 'id')

class TurnosListAdminView(generics.ListAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        penalizar_turnos_no_reclamados()
        return Turno.objects.all().order_by('-fecha')

class TurnoDetailAdminView(generics.RetrieveAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Turno.objects.all()

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

class TurnoDeleteView(generics.DestroyAPIView):
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Turno.objects.all()

class PenalizacionesUsuarioView(generics.ListAPIView):
    serializer_class = PenalizacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        return Penalizacion.objects.filter(usuario=usuario, activa=True)

class PenalizacionesListAdminView(generics.ListAPIView):
    serializer_class = PenalizacionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Penalizacion.objects.all().order_by('-fecha')

class PenalizacionDeleteView(generics.DestroyAPIView):
    serializer_class = PenalizacionSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Penalizacion.objects.all()

class DespenalizarTurnoAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, turno_id):
        try:
            turno = Turno.objects.get(id=turno_id)
            usuario = turno.usuario
            penalizaciones = Penalizacion.objects.filter(usuario=usuario, activa=True)
            if not penalizaciones.exists():
                return Response({'ok': False, 'mensaje': 'No hay penalizaciones activas para este usuario.'}, status=status.HTTP_400_BAD_REQUEST)
            penalizaciones.update(activa=False)
            # Cambiar el turno penalizado a expirado
            if turno.estado == 'penalizado':
                turno.estado = 'expirado'
                turno.save()
            return Response({'ok': True, 'mensaje': 'Penalización eliminada y turno marcado como expirado.'})
        except Turno.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'Turno no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

class TurnoActualView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        turno = Turno.objects.filter(estado='pendiente').order_by('fecha', 'id').first()
        if turno:
            data = TurnoSerializer(turno).data
        else:
            data = None
        return Response(data)