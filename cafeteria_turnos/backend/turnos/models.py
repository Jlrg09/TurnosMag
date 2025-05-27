from django.db import models
from usuarios.models import Usuario
from cafeteria.models import Cafeteria

class Turno(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('usado', 'Usado'),
        ('penalizado', 'Penalizado'),
        ('expirado', 'Expirado'),
    )
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    cafeteria = models.ForeignKey(Cafeteria, on_delete=models.CASCADE)
    fecha = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    generado_en = models.DateTimeField(auto_now_add=True)
    reclamado_en = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Turno {self.usuario} {self.fecha} ({self.estado})"

class Penalizacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha = models.DateField()
    motivo = models.CharField(max_length=255)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"Penalización {self.usuario} {self.fecha} ({'activa' if self.activa else 'inactiva'})"