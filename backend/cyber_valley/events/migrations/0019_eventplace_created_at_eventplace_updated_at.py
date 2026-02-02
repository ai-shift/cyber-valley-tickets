# Generated manually for adding created_at and updated_at fields

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0018_rename_custom_event_deposit"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventplace",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="eventplace",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
