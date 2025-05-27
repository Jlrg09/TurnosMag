from django.contrib import admin
from .models import Notificacion

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'titulo', 'enviada_en', 'leida')
    list_filter = ('leida',)
    search_fields = ('usuario__username', 'titulo')