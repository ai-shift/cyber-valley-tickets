# Event Models Generation

This directory contains auto-generated Pydantic models for blockchain events.

## ⚠️ Important: DO NOT EDIT GENERATED FILES

All `.py` files in this directory (except `patches.py` and `README.md`) are **auto-generated**. 
Each generated file contains a header comment explaining where to make changes instead.

## How It Works

1. **Auto-Generation**: Event models are generated from Solidity contract ABIs using `datamodel-codegen`
2. **Auto-Patching**: Special field types (like `bytes32`) are automatically patched with validators
3. **Header Injection**: Each file gets a header comment with modification instructions

## Generation Command

```bash
python manage.py generate_types [--print-schema]
```

This command:
1. Reads contract ABIs from `ethereum_artifacts/`
2. Generates Pydantic models with proper type annotations
3. Automatically applies field patches for special types
4. Injects informative header comments

## Field Patches

Certain Solidity types require custom Python validators. These are defined in `generate_types.py`:

- **`bytes32` fields named `digest`**: Converted to hex string using `validate_digest`
- **`bytes32` fields named `role`/`previousAdminRole`/`newAdminRole`**: Mapped to role names using `validate_role`

## Adding New Patches

To add a new field patch, edit `FIELD_PATCHES` in `cyber_valley/indexer/management/commands/generate_types.py`:

```python
FIELD_PATCHES = {
    "fieldName": {
        "annotation": "Annotated[str, BeforeValidator(your_validator)]",
        "import": "from typing import Annotated\nfrom pydantic import BeforeValidator\nfrom .patches import your_validator",
    },
}
```

Then implement the validator in `patches.py`:

```python
def your_validator(value: HexBytes) -> str:
    # Your conversion logic
    return converted_value
```

## Files

- **`CyberValleyEventManager.py`**: Generated events from CyberValleyEventManager contract
- **`CyberValleyEventTicket.py`**: Generated events from CyberValleyEventTicket contract  
- **`patches.py`**: Custom validators for special field types
- **`README.md`**: This file

## Important Notes

- **DO NOT manually edit generated files** - they will be overwritten on next generation
- Add custom validators to `patches.py` instead
- Update `FIELD_PATCHES` in `generate_types.py` to apply new validators
