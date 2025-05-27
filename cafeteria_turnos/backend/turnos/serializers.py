from rest_framework import serializers
from .models import Turno, Penalizacion
from cafeteria.serializers import CafeteriaSerializer  

class TurnoSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()
    cafeteria = CafeteriaSerializer()  

    class Meta:
        model = Turno
        fields = [
            'id', 
            'codigo_turno',  
            'usuario', 
            'cafeteria', 
            'fecha', 
            'estado', 
            'generado_en', 
            'reclamado_en'
        ]

class PenalizacionSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()

    class Meta:
        model = Penalizacion
        fields = ['id', 'usuario', 'fecha', 'motivo', 'activa']