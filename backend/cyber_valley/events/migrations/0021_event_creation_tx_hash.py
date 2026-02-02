# Generated manually for adding creation_tx_hash to Event model

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0020_add_distribution_profile"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="creation_tx_hash",
            field=models.CharField(
                max_length=66,
                null=True,
                blank=True,
                db_index=True,
            ),
        ),
    ]
