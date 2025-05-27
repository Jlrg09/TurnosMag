from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Usuario

class UsuarioTests(APITestCase):
    def test_registro_usuario(self):
        url = reverse('registro_usuario')
        data = {
            "username": "testuser",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@correo.com",
            "codigo_estudiantil": "C12345",
            "rol": "estudiante"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(username="testuser").exists())

    def test_login_usuario(self):
        Usuario.objects.create_user(username="testuser", password="testpass123", codigo_estudiantil="C12345", rol="estudiante")
        url = reverse('token_obtain_pair')
        data = {"username": "testuser", "password": "testpass123"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)