# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
        ("shaman_verification", "0001_initial"),
    ]

    operations = [
        # Delete all existing verification requests since we're adding a required field
        migrations.RunSQL(
            "DELETE FROM verification_requests;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Remove old telegram fields if they exist
        # Add requester field
        migrations.AddField(
            model_name="verificationrequest",
            name="requester",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="verification_requests",
                to="users.cybervalleyuser",
            ),
        ),
    ]
