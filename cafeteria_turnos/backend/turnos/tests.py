from django.urls import reverse
from rest_framework.test import APITestCase
from usuarios.models import Usuario
from cafeteria.models import Cafeteria
from qr.models import QRActivo
from .models import Penalizacion
from django.utils import timezone
from datetime import timedelta

class TurnoTests(APITestCase):
    def setUp(self):
        self.user = Usuario.objects.create_user(username="user", password="userpass", codigo_estudiantil="U1", rol="estudiante")
        self.cafe = Cafeteria.objects.create(nombre="Central", estado="abierta", horario_apertura="08:00", horario_cierre="15:00")
        self.qr = QRActivo.objects.create(
            cafeteria=self.cafe,
            codigo="testQR",
            generado_en=timezone.now(),
            expiracion=timezone.now() + timedelta(minutes=1)
        )

    def test_crear_turno(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('crear_turno')
        data = {"cafeteria_id": self.cafe.id, "codigo_qr": "testQR"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["estado"], "pendiente")

    def test_crear_turno_usuario_penalizado(self):
        Penalizacion.objects.create(usuario=self.user, fecha=timezone.now().date(), motivo="Test", activa=True)
        self.client.force_authenticate(user=self.user)
        url = reverse('crear_turno')
        data = {"cafeteria_id": self.cafe.id, "codigo_qr": "testQR"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 403)