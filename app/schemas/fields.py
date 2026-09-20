from typing import Annotated

from pydantic import AfterValidator, Field


def _strip(value: str) -> str:
    return value.strip()


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


NonBlankStr = Annotated[str, AfterValidator(_strip), Field(min_length=1)]
"""Required text: trimmed, must not be blank."""

OptionalText = Annotated[str | None, AfterValidator(_blank_to_none)]
"""Optional text: trimmed, empty string becomes NULL so forms can clear a field."""
