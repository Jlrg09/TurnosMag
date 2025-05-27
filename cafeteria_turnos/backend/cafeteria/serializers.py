from rest_framework import serializers
from .models import Cafeteria

class CafeteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cafeteria
        fields = ['id', 'nombre', 'estado', 'horario_apertura', 'horario_cierre', 'updated_at']