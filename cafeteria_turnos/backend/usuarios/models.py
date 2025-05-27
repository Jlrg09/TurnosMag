from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROLES = (
        ('estudiante', 'Estudiante'),
        ('admin', 'Administrador'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='estudiante')
    codigo_estudiantil = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.username} ({self.rol})"