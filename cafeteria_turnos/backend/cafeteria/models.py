from django.db import models

class Cafeteria(models.Model):
    ESTADOS = (
        ('abierta', 'Abierta'),
        ('cerrada', 'Cerrada'),
        ('reabasteciendo', 'Reabasteciendo'),
    )
    nombre = models.CharField(max_length=100)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='cerrada')
    horario_apertura = models.TimeField()
    horario_cierre = models.TimeField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.estado})"