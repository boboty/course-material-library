from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.course import SESSION_DURATIONS
from app.schemas.course import CourseRead, VocabularyRead
from app.schemas.fields import OptionalText
from app.schemas.material import MaterialRead


class SessionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: UUID
    course_id: UUID
    session_date: date
    audience_type_ids: list[UUID] = Field(min_length=1)
    audience_description: OptionalText = None
    duration: str
    notes: OptionalText = None

    @field_validator("duration")
    @classmethod
    def valid_duration(cls, value: str) -> str:
        if value not in SESSION_DURATIONS:
            raise ValueError("invalid session duration")
        return value

    @field_validator("audience_type_ids")
    @classmethod
    def distinct_audience_types(cls, value: list[UUID]) -> list[UUID]:
        seen: list[UUID] = []
        for item in value:
            if item not in seen:
                seen.append(item)
        return seen


class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    short_name: str | None
    group_name: str | None


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_date: date
    duration: str
    audience_description: str | None
    notes: str | None
    customer: CustomerSummary
    course: CourseRead
    audience_types: list[VocabularyRead]
    created_at: datetime
    updated_at: datetime


class SessionPage(BaseModel):
    items: list[SessionRead]
    page: int
    page_size: int
    total: int


class RepeatUsageRead(BaseModel):
    level: str
    session_date: date
    course_name: str
    audience_types: list[str]
    customer_name: str


class SessionMaterialCandidateRead(MaterialRead):
    repeat_usage: RepeatUsageRead | None = None
