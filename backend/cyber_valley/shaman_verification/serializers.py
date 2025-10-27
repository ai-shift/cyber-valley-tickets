from typing import Any

from rest_framework import serializers


class IndividualVerificationSerializer(serializers.Serializer[Any]):
    ktp = serializers.FileField()


class CompanyVerificationSerializer(serializers.Serializer[Any]):
    ktp = serializers.FileField()
    akta = serializers.FileField()
    sk = serializers.FileField()
