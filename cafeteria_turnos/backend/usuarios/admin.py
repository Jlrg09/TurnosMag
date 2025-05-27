from django.contrib import admin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'email', 'rol', 'codigo_estudiantil', 'is_staff', 'is_superuser']
    search_fields = ['username', 'codigo_estudiantil', 'email']
    list_filter = ['rol', 'is_staff', 'is_superuser']