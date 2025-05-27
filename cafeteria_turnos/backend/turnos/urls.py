from django.urls import path
from .views import (
    CrearTurnoView, TurnosUsuarioView,
    PenalizacionesUsuarioView, PasarTurnoView, EntregarTurnoAdminView,
    TurnosListAdminView, TurnoDetailAdminView, TurnoDeleteView,
    PenalizacionesListAdminView, PenalizacionDeleteView,
    TurnoActualView, DespenalizarTurnoAdminView,
    CrearTurnoPublicoView,
)

urlpatterns = [
    path('crear/', CrearTurnoView.as_view(), name='crear_turno'),
    path('crear/publico/', CrearTurnoPublicoView.as_view(), name='crear_turno_publico'),  
    path('mios/', TurnosUsuarioView.as_view(), name='turnos_usuario'),
    path('penalizaciones/', PenalizacionesUsuarioView.as_view(), name='penalizaciones_usuario'),
    path('admin/listar/', TurnosListAdminView.as_view(), name='turnos_list_admin'),
    path('admin/<int:pk>/', TurnoDetailAdminView.as_view(), name='turno_detail_admin'),
    path('admin/pasar/<int:turno_id>/', PasarTurnoView.as_view(), name='pasar_turno'),
    path('admin/entregar/<int:turno_id>/', EntregarTurnoAdminView.as_view(), name='entregar_turno_admin'),
    path('admin/eliminar/<int:pk>/', TurnoDeleteView.as_view(), name='turno_delete_admin'),
    path('', TurnosListAdminView.as_view(), name='turnos_list'),
    path('admin/penalizaciones/', PenalizacionesListAdminView.as_view(), name='penalizaciones_list_admin'),
    path('admin/penalizaciones/eliminar/<int:pk>/', PenalizacionDeleteView.as_view(), name='penalizacion_delete_admin'),
    path('actual/', TurnoActualView.as_view(), name='turno_actual'),
    path('admin/despenalizar/<int:turno_id>/', DespenalizarTurnoAdminView.as_view(), name='despenalizar_turno_admin'),
]