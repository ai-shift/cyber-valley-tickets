from rest_framework import serializers

from .models import CyberValleyUser


class CurrentUserSerializer(serializers.ModelSerializer[CyberValleyUser]):
    class Meta:
        model = CyberValleyUser
        fields = ("address", "role")
        read_only_fields = fields
