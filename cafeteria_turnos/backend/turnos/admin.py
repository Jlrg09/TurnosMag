from django.contrib import admin
from .models import Turno, Penalizacion

@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'cafeteria', 'fecha', 'estado', 'generado_en', 'reclamado_en')
    list_filter = ('estado', 'cafeteria', 'fecha')
    search_fields = ('usuario__username',)

@admin.register(Penalizacion)
class PenalizacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'fecha', 'motivo', 'activa')
    list_filter = ('activa',)
    search_fields = ('usuario__username',)