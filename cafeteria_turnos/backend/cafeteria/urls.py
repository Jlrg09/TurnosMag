from django.urls import path
from .views import (
    CafeteriaListView, CafeteriaDetailView,
    CafeteriaCreateView, CafeteriaUpdateView, CafeteriaDeleteView,
    CambiarEstadoCafeteriaView
)

urlpatterns = [
    path('', CafeteriaListView.as_view(), name='cafeteria_list'),
    path('<int:pk>/', CafeteriaDetailView.as_view(), name='cafeteria_detail'),
    path('crear/', CafeteriaCreateView.as_view(), name='cafeteria_create'),
    path('actualizar/<int:pk>/', CafeteriaUpdateView.as_view(), name='cafeteria_update'),
    path('eliminar/<int:pk>/', CafeteriaDeleteView.as_view(), name='cafeteria_delete'),
    path('<int:pk>/cambiar_estado/', CambiarEstadoCafeteriaView.as_view(), name='cambiar_estado_cafeteria'),
]