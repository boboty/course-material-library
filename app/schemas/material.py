from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.material import MATERIAL_TYPES


class MaterialCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    type: str
    body: str = Field(min_length=1)

    @field_validator("title", "body")
    @classmethod
    def nonblank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("type")
    @classmethod
    def valid_type(cls, value: str) -> str:
        if value not in MATERIAL_TYPES:
            raise ValueError("invalid material type")
        return value


class MaterialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    type: str | None
    body: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class MaterialPage(BaseModel):
    items: list[MaterialRead]
    page: int
    page_size: int
    total: int
