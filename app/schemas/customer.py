from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.course import VocabularyRead
from app.schemas.fields import NonBlankStr, OptionalText


class CustomerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: NonBlankStr
    short_name: OptionalText = None
    industry_id: UUID | None = None
    group_name: OptionalText = None
    notes: OptionalText = None


class CustomerUpdate(CustomerCreate):
    """标准名称唯一，编辑时排除自身；字段全量提交。"""


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    short_name: str | None
    industry_id: UUID | None
    industry: VocabularyRead | None
    group_name: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class CustomerPage(BaseModel):
    items: list[CustomerRead]
    page: int
    page_size: int
    total: int
