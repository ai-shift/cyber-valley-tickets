import json
from pprint import pformat
from typing import Any

import datamodel_code_generator
from django.conf import settings  # Import Django settings
from django.core.management.base import BaseCommand, CommandParser

SOL_TO_JSON_SCHEMA_TYPES = {
    "uint256": "integer",
    "uint16": "integer",
    "uint8": "integer",
    "address": "string",
    "bytes32": "string",
    "bool": "boolean",
}


class Command(BaseCommand):
    help = "Generates Pydantic event models from a Solidity ABI using datamodel-codegen"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--print-schema",
            action="store_true",
            help="Print the generated JSON schema to stdout before generating models.",
        )

    def handle(self, *_args: list[Any], **options: dict[str, Any]) -> None:
        assert settings.ABI_BASE_PATH.exists()
        assert settings.EVENT_MODELS_PATH.exists()

        events_abi: list[dict[str, Any]] = []
        for abi_file in settings.ABI_BASE_PATH.glob("*.json"):
            self.stdout.write(f"Parsing ABI file: {abi_file}")
            contents = json.loads(abi_file.read_text())
            events_abi.extend(
                el
                for el in contents.get("abi", ())
                if el["type"] == "event"
                and all(evt["name"] != el["name"] for evt in events_abi)
            )
        self.stdout.write(f"Parsed {len(events_abi)} raw ABI events")
        schema = {
            "title": "Cyber valley events",
            "type": "object",
            "properties": {
                event["name"]: event_abi_to_json_schema(event) for event in events_abi
            },
        }

        if options["print_schema"]:
            self.stdout.write("Generated JSON Schema:")
            self.stdout.write(pformat(schema))

        datamodel_code_generator.generate(
            json.dumps(schema),
            input_file_type=datamodel_code_generator.InputFileType.JsonSchema,
            snake_case_field=True,
            output=settings.EVENT_MODELS_PATH,
            use_double_quotes=True,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Models saved to {settings.EVENT_MODELS_PATH}")
        )


def event_abi_to_json_schema(abi: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "object",
        "required": [arg["name"] for arg in abi["inputs"]],
        "properties": {
            arg["name"]: {"type": SOL_TO_JSON_SCHEMA_TYPES[arg["type"]]}
            for arg in abi["inputs"]
        },
    }
