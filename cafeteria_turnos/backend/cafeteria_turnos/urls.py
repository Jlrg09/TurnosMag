from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/cafeteria/', include('cafeteria.urls')),
    path('api/turnos/', include('turnos.urls')),
    path('api/qr/', include('qr.urls')),
    path('api/notificaciones/', include('notificaciones.urls')),
]