from django.urls import path
from .views import (
    NotificacionesUsuarioView,
    MarcarNotificacionLeidaView,
    NotificacionCreateView,
    NotificacionesListAdminView,
    NotificacionDeleteView
)
from .views import RegistrarDispositivoPushView

urlpatterns = [
    path('mias/', NotificacionesUsuarioView.as_view(), name='notificaciones_usuario'),
    path('marcar_leida/<int:pk>/', MarcarNotificacionLeidaView.as_view(), name='marcar_notificacion_leida'),
    path('crear/', NotificacionCreateView.as_view(), name='crear_notificacion'),  # solo admin
    path('admin/listar/', NotificacionesListAdminView.as_view(), name='notificaciones_list_admin'),
    path('admin/eliminar/<int:pk>/', NotificacionDeleteView.as_view(), name='notificacion_delete_admin'),
    path('registrar_dispositivo/', RegistrarDispositivoPushView.as_view(), name='registrar_dispositivo_push')

]