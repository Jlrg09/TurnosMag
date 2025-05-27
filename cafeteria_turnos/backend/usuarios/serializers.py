from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'rol', 'codigo_estudiantil']

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'codigo_estudiantil', 'rol']

    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            codigo_estudiantil=validated_data.get('codigo_estudiantil', ''),
            rol=validated_data.get('rol', 'estudiante')
        )
        return user

class UsuarioUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['first_name', 'last_name', 'email']

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

# Serializer personalizado para JWT que retorna el rol y otros datos en el response
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['rol'] = user.rol
        token['codigo_estudiantil'] = getattr(user, 'codigo_estudiantil', '')
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Estos campos estarán en el response del login
        data['username'] = self.user.username
        data['rol'] = getattr(self.user, 'rol', '')
        data['codigo_estudiantil'] = getattr(self.user, 'codigo_estudiantil', '')
        return data