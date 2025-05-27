from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Notificacion
from .serializers import NotificacionSerializer
from rest_framework.views import APIView
from django.utils import timezone
from usuarios.models import Usuario
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DispositivoPush
from .utils import enviar_push

class RegistrarDispositivoPushView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("token")
        plataforma = request.data.get("plataforma")
        if not token or not plataforma:
            return Response({"ok": False, "error": "token y plataforma requeridos"}, status=400)
        obj, created = DispositivoPush.objects.update_or_create(
            usuario=request.user, token=token,
            defaults={"plataforma": plataforma}
        )
        return Response({"ok": True})
# Listar notificaciones del usuario autenticado
class NotificacionesUsuarioView(generics.ListAPIView):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notificacion.objects.filter(usuario=self.request.user).order_by('-enviada_en')

# Marcar notificación como leída (propia)
class MarcarNotificacionLeidaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            noti = Notificacion.objects.get(id=pk, usuario=request.user)
            noti.leida = True
            noti.save()
            return Response({'ok': True})
        except Notificacion.DoesNotExist:
            return Response({'ok': False, 'mensaje': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

# Crear notificación para usuario específico (admin)
class NotificacionCreateView(generics.CreateAPIView):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(enviada_en=timezone.now())
        noti = serializer.save(enviada_en=timezone.now())
        enviar_push(noti.usuario, noti.titulo, noti.mensaje)

# Listar todas las notificaciones (admin)
class NotificacionesListAdminView(generics.ListAPIView):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Notificacion.objects.all().order_by('-enviada_en')

# (Opcional) Eliminar notificación (admin)
class NotificacionDeleteView(generics.DestroyAPIView):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Notificacion.objects.all()