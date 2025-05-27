from rest_framework import serializers
from .models import QRActivo

class QRActivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRActivo
        fields = ['id', 'cafeteria', 'codigo', 'generado_en', 'expiracion']