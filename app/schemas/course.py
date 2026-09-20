from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.course import COURSE_STATUSES
from app.schemas.fields import NonBlankStr, OptionalText


class VocabularyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: NonBlankStr


class VocabularyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class VocabularyPage(BaseModel):
    items: list[VocabularyRead]
    page: int
    page_size: int
    total: int


class CourseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: NonBlankStr
    alias: OptionalText = None
    status: str = "启用"

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in COURSE_STATUSES:
            raise ValueError("invalid course status")
        return value


class CourseUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: NonBlankStr
    alias: OptionalText = None
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in COURSE_STATUSES:
            raise ValueError("invalid course status")
        return value


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    alias: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class CoursePage(BaseModel):
    items: list[CourseRead]
    page: int
    page_size: int
    total: int
