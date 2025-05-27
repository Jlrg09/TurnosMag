from django.contrib import admin
from .models import Cafeteria

@admin.register(Cafeteria)
class CafeteriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'estado', 'horario_apertura', 'horario_cierre', 'updated_at']
    search_fields = ['nombre']
    list_filter = ['estado']