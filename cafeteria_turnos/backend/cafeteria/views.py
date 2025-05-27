from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Cafeteria
from .serializers import CafeteriaSerializer
from rest_framework.views import APIView

# Listar todas las cafeterías (accesible a todos)
class CafeteriaListView(generics.ListAPIView):
    queryset = Cafeteria.objects.all()
    serializer_class = CafeteriaSerializer
    permission_classes = [permissions.AllowAny]

# Obtener detalles de una cafetería
class CafeteriaDetailView(generics.RetrieveAPIView):
    queryset = Cafeteria.objects.all()
    serializer_class = CafeteriaSerializer
    permission_classes = [permissions.AllowAny]

# Crear una cafetería (solo admin)
class CafeteriaCreateView(generics.CreateAPIView):
    queryset = Cafeteria.objects.all()
    serializer_class = CafeteriaSerializer
    permission_classes = [permissions.IsAdminUser]

# Actualizar una cafetería (solo admin)
class CafeteriaUpdateView(generics.UpdateAPIView):
    queryset = Cafeteria.objects.all()
    serializer_class = CafeteriaSerializer
    permission_classes = [permissions.IsAdminUser]

# Eliminar una cafetería (solo admin)
class CafeteriaDeleteView(generics.DestroyAPIView):
    queryset = Cafeteria.objects.all()
    serializer_class = CafeteriaSerializer
    permission_classes = [permissions.IsAdminUser]

# Cambiar estado de una cafetería (solo admin, vía POST)
class CambiarEstadoCafeteriaView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        cafeteria = Cafeteria.objects.get(pk=pk)
        nuevo_estado = request.data.get('estado')
        if nuevo_estado in dict(Cafeteria.ESTADOS):
            cafeteria.estado = nuevo_estado
            cafeteria.save()
            return Response(CafeteriaSerializer(cafeteria).data)
        return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)