from django.urls import reverse
from rest_framework.test import APITestCase
from .models import QRActivo
from cafeteria.models import Cafeteria
from usuarios.models import Usuario
from django.utils import timezone
from datetime import timedelta

class QRTests(APITestCase):
    def setUp(self):
        self.cafe = Cafeteria.objects.create(nombre="Central", estado="abierta", horario_apertura="08:00", horario_cierre="15:00")
        self.user = Usuario.objects.create_user(username="user", password="userpass", codigo_estudiantil="U1", rol="estudiante")
        self.qr = QRActivo.objects.create(
            cafeteria=self.cafe,
            codigo="testQR",
            generado_en=timezone.now(),
            expiracion=timezone.now() + timedelta(minutes=1)
        )

    def test_validar_qr_valido(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('validar_qr')
        data = {"codigo": "testQR", "cafeteria_id": self.cafe.id}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["valido"])