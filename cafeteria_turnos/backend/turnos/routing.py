from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/turnos/actual/$', consumers.TurnoActualConsumer.as_asgi()),
]