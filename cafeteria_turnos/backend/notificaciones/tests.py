from django.urls import reverse
from rest_framework.test import APITestCase
from usuarios.models import Usuario
from .models import Notificacion

class NotificacionesTests(APITestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(username="user", password="userpass", codigo_estudiantil="U1", rol="estudiante")
        self.noti = Notificacion.objects.create(usuario=self.user, titulo="Hola", mensaje="Test", leida=False)

    def test_listar_notificaciones(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('notificaciones_usuario')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_marcar_leida(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('marcar_notificacion_leida', args=[self.noti.id])
        response = self.client.post(url)
        self.noti.refresh_from_db()
        self.assertTrue(self.noti.leida)