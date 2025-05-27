from rest_framework import serializers
from .models import Turno, Penalizacion
from cafeteria.serializers import CafeteriaSerializer  # Importa tu serializer de cafetería

class TurnoSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()
    cafeteria = CafeteriaSerializer()  # Usa el serializer completo

    class Meta:
        model = Turno
        fields = ['id', 'usuario', 'cafeteria', 'fecha', 'estado', 'generado_en', 'reclamado_en']

class PenalizacionSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()

    class Meta:
        model = Penalizacion
        fields = ['id', 'usuario', 'fecha', 'motivo', 'activa']