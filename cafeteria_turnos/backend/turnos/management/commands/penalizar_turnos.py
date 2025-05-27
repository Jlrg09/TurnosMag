from django.core.management.base import BaseCommand
from turnos.utils import penalizar_turnos_expirados

class Command(BaseCommand):
    help = 'Penaliza automáticamente a los usuarios que no reclamaron su turno a tiempo'

    def handle(self, *args, **options):
        penalizar_turnos_expirados()
        self.stdout.write(self.style.SUCCESS('Penalizaciones aplicadas a los turnos expirados.'))