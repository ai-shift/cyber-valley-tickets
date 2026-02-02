# Generated migration for DistributionProfile model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0019_eventplace_created_at_eventplace_updated_at"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create DistributionProfile model
        migrations.CreateModel(
            name="DistributionProfile",
            fields=[
                (
                    "id",
                    models.PositiveIntegerField(primary_key=True, serialize=False),
                ),
                ("recipients", models.JSONField(default=list)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="owned_distribution_profiles",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        # Add distribution_profile field to Event model
        migrations.AddField(
            model_name="event",
            name="distribution_profile",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="events",
                to="events.distributionprofile",
            ),
        ),
    ]
