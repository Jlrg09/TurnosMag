from django.urls import reverse
from rest_framework.test import APITestCase
from .models import Cafeteria
from usuarios.models import Usuario

class CafeteriaTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_superuser(username="admin", password="adminpass", codigo_estudiantil="A1", rol="admin")
        self.cafe = Cafeteria.objects.create(nombre="Central", estado="abierta", horario_apertura="08:00", horario_cierre="15:00")

    def test_listar_cafeterias(self):
        url = reverse('cafeteria_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_cambiar_estado_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('cambiar_estado_cafeteria', args=[self.cafe.id])
        response = self.client.post(url, {"estado": "cerrada"})
        self.cafe.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.cafe.estado, "cerrada")