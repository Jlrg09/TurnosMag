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