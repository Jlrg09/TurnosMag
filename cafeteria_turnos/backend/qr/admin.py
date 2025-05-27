from django.contrib import admin
from .models import QRActivo

@admin.register(QRActivo)
class QRActivoAdmin(admin.ModelAdmin):
    list_display = ('cafeteria', 'codigo', 'generado_en', 'expiracion')
    search_fields = ('codigo',)
    list_filter = ('cafeteria',)