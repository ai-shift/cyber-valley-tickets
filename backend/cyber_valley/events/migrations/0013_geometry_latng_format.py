# Generated manually for geometry coordinates format migration

from typing import Any

from django.apps.registry import Apps
from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor


def convert_array_to_latng(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    """Convert geometry coordinates from [lng, lat] array to {lat, lng} object."""
    EventPlace = apps.get_model("events", "EventPlace")
    # Check if geometry field exists in model
    try:
        # Try to access the field - will raise FieldDoesNotExist if not present
        EventPlace._meta.get_field("geometry")
    except Exception:
        # Column doesn't exist yet, skip migration
        return

    for place in EventPlace.objects.all():
        if place.geometry and isinstance(place.geometry, dict):
            coordinates = place.geometry.get("coordinates")
            geom_type = place.geometry.get("type")

            if (
                geom_type == "Point"
                and isinstance(coordinates, list)
                and len(coordinates) == 2
            ):
                # Convert [lng, lat] to {lat, lng}
                place.geometry["coordinates"] = {
                    "lng": coordinates[0],
                    "lat": coordinates[1],
                }
                place.save()


def convert_latng_to_array(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    """Reverse: Convert {lat, lng} back to [lng, lat] array."""
    EventPlace = apps.get_model("events", "EventPlace")
    for place in EventPlace.objects.all():
        if place.geometry and isinstance(place.geometry, dict):
            coordinates = place.geometry.get("coordinates")
            geom_type = place.geometry.get("type")

            if geom_type == "Point" and isinstance(coordinates, dict):
                # Convert {lat, lng} to [lng, lat]
                place.geometry["coordinates"] = [
                    coordinates.get("lng", 0),
                    coordinates.get("lat", 0),
                ]
                place.save()


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0012_eventplace_geometry_remove_location_url"),
    ]

    operations = [
        migrations.RunPython(
            convert_array_to_latng,
            reverse_code=convert_latng_to_array,
        ),
    ]
