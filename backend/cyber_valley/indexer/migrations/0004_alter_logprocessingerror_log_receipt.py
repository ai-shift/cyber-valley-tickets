# Generated by Django 5.2 on 2025-05-20 23:32

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("indexer", "0003_alter_logprocessingerror_log_receipt"),
    ]

    operations = [
        migrations.AlterField(
            model_name="logprocessingerror",
            name="log_receipt",
            field=models.BinaryField(),
        ),
    ]
