# Generated manually

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shaman_verification", "0003_remove_metadata_cid_unique"),
    ]

    operations = [
        migrations.AddField(
            model_name="verificationrequest",
            name="uuid",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
