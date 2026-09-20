from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class UsageResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    status: str
    effect: str = "未评"
    reaction: str | None = None

    @field_validator("reaction")
    @classmethod
    def normalize_reaction(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @model_validator(mode="after")
    def valid_result(self) -> "UsageResult":
        if self.status not in ("已用", "未用"):
            raise ValueError("invalid status")
        if self.effect not in ("未评", "好", "差"):
            raise ValueError("invalid effect")
        if self.status == "未用" and (self.effect != "未评" or self.reaction is not None):
            raise ValueError("unused must be unrated without reaction")
        return self


class TemporaryUsage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    material_id: UUID
    effect: str = "未评"
    reaction: str | None = None

    @field_validator("reaction")
    @classmethod
    def normalize_reaction(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @model_validator(mode="after")
    def valid_result(self) -> "TemporaryUsage":
        if self.effect not in ("未评", "好", "差"):
            raise ValueError("invalid effect")
        return self


class TemporaryMaterial(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    effect: str = "未评"
    reaction: str | None = None

    @field_validator("title")
    @classmethod
    def nonblank_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("title must not be blank")
        return value

    @field_validator("reaction")
    @classmethod
    def normalize_reaction(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @model_validator(mode="after")
    def valid_result(self) -> "TemporaryMaterial":
        if self.effect not in ("未评", "好", "差"):
            raise ValueError("invalid effect")
        return self


class PostClassSave(BaseModel):
    model_config = ConfigDict(extra="forbid")

    usages: list[UsageResult]
    existing_materials: list[TemporaryUsage] = Field(default_factory=list)
    new_materials: list[TemporaryMaterial] = Field(default_factory=list)
