from django.utils import timezone
from .models import Turno, Penalizacion

def penalizar_turnos_expirados():
    ahora = timezone.now()
    # Considera expirar los turnos del día anterior o con tiempo límite
    turnos_expirados = Turno.objects.filter(estado='pendiente', fecha__lt=ahora.date())
    for turno in turnos_expirados:
        # Penalizar solo si no existe penalización para esa fecha
        if not Penalizacion.objects.filter(usuario=turno.usuario, fecha=turno.fecha, activa=True).exists():
            Penalizacion.objects.create(
                usuario=turno.usuario,
                fecha=turno.fecha,
                motivo='No reclamó su turno a tiempo',
                activa=True
            )
        turno.estado = 'penalizado'
        turno.save()

# === Notificación de cambio de turno vía WebSocket ===
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notificar_cambio_turno():
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'turno_actual',
        {'type': 'turno_cambiado'}
    )