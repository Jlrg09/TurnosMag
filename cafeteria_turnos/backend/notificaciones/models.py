from django.db import models
from usuarios.models import Usuario

class Notificacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=100)
    mensaje = models.TextField()
    enviada_en = models.DateTimeField(auto_now_add=True)
    leida = models.BooleanField(default=False)

    def __str__(self):
        return f"Notificación para {self.usuario}: {self.titulo}"
    
class DispositivoPush(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="dispositivos_push")
    token = models.CharField(max_length=255, unique=True)
    plataforma = models.CharField(max_length=20, choices=[("android", "Android"), ("ios", "iOS"), ("web", "Web")])
    creado_en = models.DateTimeField(auto_now_add=True)