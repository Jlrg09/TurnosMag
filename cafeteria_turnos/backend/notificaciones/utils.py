from pyfcm import FCMNotification
from django.conf import settings

def enviar_push(usuario, titulo, mensaje):
    from .models import DispositivoPush
    push_service = FCMNotification(api_key=settings.FCM_SERVER_KEY)
    tokens = list(DispositivoPush.objects.filter(usuario=usuario).values_list('token', flat=True))
    if not tokens:
        return False
    result = push_service.notify_multiple_devices(registration_ids=tokens, message_title=titulo, message_body=mensaje)
    return result

def enviar_push_todos(titulo, mensaje):
    from .models import DispositivoPush
    push_service = FCMNotification(api_key=settings.FCM_SERVER_KEY)
    tokens = list(DispositivoPush.objects.values_list('token', flat=True))
    if tokens:
        push_service.notify_multiple_devices(registration_ids=tokens, message_title=titulo, message_body=mensaje)