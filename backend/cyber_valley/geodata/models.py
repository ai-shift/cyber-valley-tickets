from django.db import models


class GeodataLayer(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    data = models.JSONField()
    source_file = models.CharField(max_length=500, blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "geodata_layer"
        ordering = ["name"]

    def __str__(self):
        return self.name
