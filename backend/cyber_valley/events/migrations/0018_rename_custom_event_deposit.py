# Generated manually

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0017_alter_ticket_unique_together_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="eventplace",
            old_name="custom_event_deposit",
            new_name="event_deposit_size",
        ),
    ]
