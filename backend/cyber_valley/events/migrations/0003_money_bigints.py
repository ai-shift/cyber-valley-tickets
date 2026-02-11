from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0002_referral_link"),
    ]

    operations = [
        migrations.AlterField(
            model_name="eventplace",
            name="event_deposit_size",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="event",
            name="paid_deposit",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="event",
            name="total_revenue",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="ticket",
            name="price_paid",
            field=models.PositiveBigIntegerField(default=0),
        ),
    ]
