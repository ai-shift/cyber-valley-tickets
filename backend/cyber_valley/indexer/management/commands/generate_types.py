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

FIELD_PATCHES = {
    "digest": {
        "annotation": "Annotated[str, BeforeValidator(validate_digest)]",
        "import": (
            "from typing import Annotated\n"
            "from pydantic import BeforeValidator\n"
            "from .patches import validate_digest"
        ),
    },
    "role": {
        "annotation": "Annotated[str, BeforeValidator(validate_role)]",
        "import": (
            "from typing import Annotated\n"
            "from pydantic import BeforeValidator\n"
            "from .patches import validate_role"
        ),
    },
    "previousAdminRole": {
        "annotation": "Annotated[str, BeforeValidator(validate_role)]",
        "import": (
            "from typing import Annotated\n"
            "from pydantic import BeforeValidator\n"
            "from .patches import validate_role"
        ),
    },
    "newAdminRole": {
        "annotation": "Annotated[str, BeforeValidator(validate_role)]",
        "import": (
            "from typing import Annotated\n"
            "from pydantic import BeforeValidator\n"
            "from .patches import validate_role"
        ),
    },
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

            output_path = settings.EVENT_MODELS_BASE_PATH / (info_path.stem + ".py")

            datamodel_code_generator.generate(
                json.dumps(schema),
                input_file_type=datamodel_code_generator.InputFileType.JsonSchema,
                snake_case_field=True,
                output=output_path,
                use_double_quotes=True,
                enable_faux_immutability=True,
                output_model_type=DataModelType.PydanticV2BaseModel,
                custom_file_header_path=Path(__file__).parent / "model_header.txt",
            )

            apply_patches(output_path, events_abi)

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


def apply_patches(output_path: Path, events_abi: list[dict[str, Any]]) -> None:
    """Apply field-specific patches to generated models."""
    needed_imports, fields_to_patch = _collect_patches(events_abi)
    if not fields_to_patch:
        return

    content = output_path.read_text()
    new_content = _inject_imports_and_patch_fields(
        content, needed_imports, fields_to_patch
    )
    output_path.write_text(new_content)


def _collect_patches(events_abi: list[dict[str, Any]]) -> tuple[set[str], set[str]]:
    """Collect patches needed for events."""
    needed_imports = set()
    fields_to_patch = set()

    for event in events_abi:
        for arg in event["inputs"]:
            if arg["name"] in FIELD_PATCHES:
                fields_to_patch.add(arg["name"])
                needed_imports.add(FIELD_PATCHES[arg["name"]]["import"])

    return needed_imports, fields_to_patch


def _inject_imports_and_patch_fields(
    content: str, needed_imports: set[str], fields_to_patch: set[str]
) -> str:
    """Inject imports after __future__ and patch field types."""
    lines = content.split("\n")
    new_lines: list[str] = []
    imports_added = False
    header_lines: list[str] = []
    in_header = True

    for line in lines:
        if in_header and (line.startswith("#") or not line.strip()):
            header_lines.append(line)
            continue

        if in_header:
            in_header = False
            new_lines.extend(header_lines)

        if line.startswith("from __future__") and not imports_added:
            new_lines.append(line)
            new_lines.append("")
            new_lines.extend(sorted(needed_imports))
            imports_added = True
        elif not imports_added and line.startswith(("from ", "import ")):
            continue
        else:
            new_lines.append(_patch_field_line(line, fields_to_patch))

    return "\n".join(new_lines)


def _patch_field_line(line: str, fields_to_patch: set[str]) -> str:
    """Patch field type annotation in a single line."""
    patched = line
    for field_name in fields_to_patch:
        snake_field = to_snake_case(field_name)
        if f"{snake_field}: str" in line and "Field(" in line:
            annotation = FIELD_PATCHES[field_name]["annotation"]
            patched = line.replace(
                f"{snake_field}: str", f"{snake_field}: {annotation}"
            )
    return patched


def to_snake_case(name: str) -> str:
    """Convert camelCase to snake_case."""
    import re

    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
