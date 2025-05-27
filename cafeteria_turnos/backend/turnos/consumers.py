import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TurnoActualConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('turno_actual', self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('turno_actual', self.channel_name)

    async def receive(self, text_data):
        pass

    async def turno_cambiado(self, event):
        await self.send(text_data=json.dumps({
            'type': 'turno_cambiado',
            'message': '¡El turno ha cambiado!'
        }))