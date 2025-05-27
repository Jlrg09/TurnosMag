from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario
from .forms import CustomUserChangeForm, CustomUserCreationForm

class UsuarioAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = Usuario
    list_display = ['username', 'first_name', 'last_name', 'email', 'rol', 'codigo_estudiantil', 'is_staff', 'is_superuser']
    search_fields = ['username', 'codigo_estudiantil', 'email']
    list_filter = ['rol', 'is_staff', 'is_superuser']
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('rol', 'codigo_estudiantil')}),
    )
    # Aquí personalizas los campos para el formulario de creación de usuario:
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'rol', 'codigo_estudiantil', 'password1', 'password2'),
        }),
    )

admin.site.register(Usuario, UsuarioAdmin)