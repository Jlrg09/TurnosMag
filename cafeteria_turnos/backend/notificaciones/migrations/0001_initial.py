# Generated by Django 5.2.1 on 2025-05-27 05:09

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=100)),
                ('mensaje', models.TextField()),
                ('enviada_en', models.DateTimeField(auto_now_add=True)),
                ('leida', models.BooleanField(default=False)),
            ],
        ),
    ]
