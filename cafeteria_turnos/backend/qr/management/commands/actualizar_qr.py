from django.core.management.base import BaseCommand
from cafeteria.models import Cafeteria
from qr.models import QRActivo

class Command(BaseCommand):
    help = 'Genera o actualiza el QR dinámico de cada cafetería'

    def handle(self, *args, **options):
        for cafeteria in Cafeteria.objects.all():
            qr = QRActivo.crear_o_actualizar_qr(cafeteria)
            self.stdout.write(self.style.SUCCESS(
                f"QR actualizado para {cafeteria.nombre}: {qr.codigo} (Expira: {qr.expiracion})"
            ))