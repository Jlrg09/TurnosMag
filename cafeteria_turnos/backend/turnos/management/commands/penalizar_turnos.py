from django.core.management.base import BaseCommand
from turnos.utils import penalizar_turnos_no_reclamados

class Command(BaseCommand):
    help = 'Penaliza turnos no reclamados en 30 segundos'

    def handle(self, *args, **kwargs):
        penalizar_turnos_no_reclamados()
        self.stdout.write(self.style.SUCCESS('Penalizaciones ejecutadas'))