from django.urls import path
from .views import (
    RegistroUsuarioView, CustomTokenObtainPairView,
    UsuarioPerfilView, UsuarioDetailView,
    UsuarioUpdateView, PasswordChangeView,
    UsuarioListView, UsuarioDeleteView
)

urlpatterns = [
    path('registro/', RegistroUsuarioView.as_view(), name='registro_usuario'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('perfil/', UsuarioPerfilView.as_view(), name='usuario_perfil'),
    path('perfil/<int:pk>/', UsuarioDetailView.as_view(), name='usuario_detail'),
    path('actualizar/', UsuarioUpdateView.as_view(), name='usuario_update'),
    path('cambiar_password/', PasswordChangeView.as_view(), name='cambiar_password'),
    path('listar/', UsuarioListView.as_view(), name='usuarios_list'),
    path('eliminar/<int:pk>/', UsuarioDeleteView.as_view(), name='usuario_delete'),
]