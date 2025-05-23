import json
from pathlib import Path
from pprint import pformat
from typing import Any

import datamodel_code_generator
from datamodel_code_generator import DataModelType
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
        for info_path in settings.CONTRACTS_INFO:
            self.stdout.write(f"Parsing ABI file: {info_path}")
            contents = json.loads(info_path.read_text())
            events_abi = [el for el in contents.get("abi", ()) if el["type"] == "event"]
            self.stdout.write(f"Parsed {len(events_abi)} raw ABI events")
            schema = {
                "title": "Cyber valley events",
                "type": "object",
                "properties": {
                    event["name"]: event_abi_to_json_schema(event)
                    for event in events_abi
                },
            }

            if options["print_schema"]:
                self.stdout.write("Generated JSON Schema:")
                self.stdout.write(pformat(schema))

            datamodel_code_generator.generate(
                json.dumps(schema),
                input_file_type=datamodel_code_generator.InputFileType.JsonSchema,
                snake_case_field=True,
                output=settings.EVENT_MODELS_BASE_PATH / (info_path.stem + ".py"),
                use_double_quotes=True,
                enable_faux_immutability=True,
                output_model_type=DataModelType.PydanticV2BaseModel,
                custom_file_header_path=Path(__file__).parent / "model_header.txt",
            )
        self.stdout.write(
            self.style.SUCCESS(f"Models saved to {settings.EVENT_MODELS_BASE_PATH}")
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
