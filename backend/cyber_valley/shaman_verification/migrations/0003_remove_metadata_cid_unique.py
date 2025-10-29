# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shaman_verification", "0002_verificationrequest_requester"),
    ]

    operations = [
        migrations.AlterField(
            model_name="verificationrequest",
            name="metadata_cid",
            field=models.CharField(max_length=255),
        ),
    ]
