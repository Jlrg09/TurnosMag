from django.db import models
import random
import string

class Turno(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('usado', 'Usado'),
        ('entregado', 'Entregado'),  # <-- Agregado para el nuevo estado
        ('penalizado', 'Penalizado'),
        ('expirado', 'Expirado'),
    )
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE)
    cafeteria = models.ForeignKey('cafeteria.Cafeteria', on_delete=models.CASCADE)
    fecha = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    generado_en = models.DateTimeField(auto_now_add=True)
    reclamado_en = models.DateTimeField(null=True, blank=True)
    codigo_turno = models.CharField(max_length=10, unique=True, blank=True, null=True)  # NUEVO

    def save(self, *args, **kwargs):
        if not self.codigo_turno:
            self.codigo_turno = self.generar_codigo_unico()
        super().save(*args, **kwargs)

    @staticmethod
    def generar_codigo_unico(longitud=6):
        while True:
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=longitud))
            if not Turno.objects.filter(codigo_turno=codigo).exists():
                return codigo

    def __str__(self):
        return f"Turno {self.usuario} {self.fecha} ({self.estado}) [{self.codigo_turno}]"

class Penalizacion(models.Model):
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE)
    fecha = models.DateField()
    motivo = models.CharField(max_length=255)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"Penalización {self.usuario} {self.fecha} ({'activa' if self.activa else 'inactiva'})"