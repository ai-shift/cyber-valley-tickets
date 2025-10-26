import logging
from argparse import ArgumentParser
from typing import Any

from django.core.management.base import BaseCommand

from cyber_valley.geodata.service.kml_processor import sync_geodata

log = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Download and process KMZ file from Google Maps"

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--url",
            type=str,
            default="https://www.google.com/maps/d/kml?mid=1txZioQKBBvOdmox1Had5aI-Zz4kUEJI&resourcekey",
            help="URL to download KMZ file from",
        )

    def handle(self, **options: Any) -> None:
        sync_geodata(options["url"])
