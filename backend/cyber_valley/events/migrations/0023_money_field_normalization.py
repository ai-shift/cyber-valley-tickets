# Generated manually for normalizing money field types

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0022_add_price_paid_and_fix_website"),
    ]

    operations = [
        # Event model
        migrations.AlterField(
            model_name="event",
            name="ticket_price",
            field=models.PositiveBigIntegerField(),
        ),
        migrations.AlterField(
            model_name="event",
            name="tickets_bought",
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name="event",
            name="days_amount",
            field=models.PositiveIntegerField(),
        ),
        # EventPlace model
        migrations.AlterField(
            model_name="eventplace",
            name="max_tickets",
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name="eventplace",
            name="min_tickets",
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name="eventplace",
            name="min_price",
            field=models.PositiveBigIntegerField(),
        ),
        migrations.AlterField(
            model_name="eventplace",
            name="min_days",
            field=models.PositiveIntegerField(),
        ),
        # TicketCategory model
        migrations.AlterField(
            model_name="ticketcategory",
            name="discount",
            field=models.PositiveIntegerField(),
        ),
    ]
