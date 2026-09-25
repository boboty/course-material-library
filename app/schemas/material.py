from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.material import MATERIAL_TYPES
from app.schemas.course import CourseRead, VocabularyRead


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


class MaterialUpdate(BaseModel):
    """编辑基础字段；草稿允许类型 / 正文为空，非草稿完整性由接口校验。"""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    type: str | None
    body: str | None
    supporting_judgment: str | None = None
    speaking_notes: str | None = None
    source_note: str | None = None
    course_ids: list[UUID] | None = None
    audience_type_ids: list[UUID] | None = None
    industry_ids: list[UUID] | None = None
    status: Literal["草稿", "可用", "主力", "待更新", "退役"]

    @field_validator("title")
    @classmethod
    def nonblank_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("body")
    @classmethod
    def blank_body_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @field_validator("type")
    @classmethod
    def valid_type(cls, value: str | None) -> str | None:
        if value is not None and value not in MATERIAL_TYPES:
            raise ValueError("invalid material type")
        return value

    @field_validator("supporting_judgment", "speaking_notes", "source_note")
    @classmethod
    def blank_optional_text_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class MaterialMarkdownImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    markdown: str


class MaterialMarkdownImportResult(BaseModel):
    count: int


class MaterialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    type: str | None
    body: str | None
    supporting_judgment: str | None
    speaking_notes: str | None
    source_note: str | None
    courses: list[CourseRead]
    audience_types: list[VocabularyRead]
    industries: list[VocabularyRead]
    status: str
    created_at: datetime
    updated_at: datetime


class MaterialPage(BaseModel):
    items: list[MaterialRead]
    page: int
    page_size: int
    total: int
