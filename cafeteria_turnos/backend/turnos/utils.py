from django.utils import timezone
from datetime import timedelta
from .models import Turno, Penalizacion

# Si usas Django Channels, descomenta estas líneas, si no, déjalo como pass abajo
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync

def penalizar_turnos_no_reclamados():
    """
    Busca turnos pendientes a los que ya les tocó, han pasado 30s y no han sido reclamados.
    Penaliza al usuario por 15 minutos.
    """
    ahora = timezone.now()
    # Filtramos los turnos pendientes cuyo turno fue generado hace más de 30s y no han sido reclamados
    turnos = Turno.objects.filter(
        estado='pendiente',
        generado_en__lte=ahora - timedelta(seconds=30),
        reclamado_en__isnull=True
    )

    for turno in turnos:
        # Verifica si ya existe una penalización activa para ese usuario en ese día, creada en los últimos 15 minutos
        penalizacion_reciente = Penalizacion.objects.filter(
            usuario=turno.usuario,
            activa=True,
            creada_en__gte=ahora - timedelta(minutes=15)
        ).exists()
        if not penalizacion_reciente:
            Penalizacion.objects.create(
                usuario=turno.usuario,
                fecha=turno.fecha,
                motivo='No reclamó su turno en 30 segundos',
                activa=True
            )
        turno.estado = 'penalizado'
        turno.save()

def usuario_penalizado(usuario):
    """
    Devuelve True si el usuario tiene una penalización activa en los últimos 15 minutos.
    """
    ahora = timezone.now()
    quince_min_antes = ahora - timedelta(minutes=15)
    return Penalizacion.objects.filter(
        usuario=usuario,
        activa=True,
        creada_en__gte=quince_min_antes
    ).exists()

def notificar_cambio_turno():
    # Si usas Django Channels para notificaciones en tiempo real, descomenta y usa esto:
    # channel_layer = get_channel_layer()
    # async_to_sync(channel_layer.group_send)(
    #     'turno_actual',
    #     {'type': 'turno_cambiado'}
    # )
    pass  # Si no usas channels, déjalo como pass