import secrets
from django.utils import timezone
from datetime import timedelta
from django.db import models
from cafeteria.models import Cafeteria

class QRActivo(models.Model):
    cafeteria = models.ForeignKey(Cafeteria, on_delete=models.CASCADE)
    codigo = models.CharField(max_length=100)  # Valor actual del QR dinámico
    generado_en = models.DateTimeField(auto_now_add=True)
    expiracion = models.DateTimeField()  # Cuándo expira este QR

    def __str__(self):
        return f"QR {self.cafeteria} ({self.codigo})"

    @staticmethod
    def generar_codigo():
        # Puedes ajustar la longitud y complejidad aquí
        return secrets.token_urlsafe(16)

    @classmethod
    def crear_o_actualizar_qr(cls, cafeteria, duracion_minutos=1):
        ahora = timezone.now()
        expiracion = ahora + timedelta(minutes=duracion_minutos)

        # Verifica si ya existe un QR activo y si sigue vigente
        qr_existente = cls.objects.filter(
            cafeteria=cafeteria, expiracion__gt=ahora
        ).first()

        if qr_existente:
            return qr_existente

        # Crea un nuevo QR
        codigo = cls.generar_codigo()
        qr = cls.objects.create(
            cafeteria=cafeteria,
            codigo=codigo,
            generado_en=ahora,
            expiracion=expiracion
        )
        return qr