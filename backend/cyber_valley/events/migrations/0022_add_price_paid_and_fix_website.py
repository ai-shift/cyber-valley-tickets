# Generated manually for adding price_paid to Ticket and fixing website field

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0021_event_creation_tx_hash"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="price_paid",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="event",
            name="website",
            field=models.URLField(max_length=2048, blank=True, null=True),
        ),
    ]
