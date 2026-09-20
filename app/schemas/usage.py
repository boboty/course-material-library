from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.material import MaterialRead


class UsageCreate(BaseModel):
    """备课阶段只能指定素材；状态与效果由服务端固定为“计划 + 未评”。"""

    model_config = ConfigDict(extra="forbid")

    material_id: UUID


class UsageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    material_id: UUID
    status: str
    effect: str
    reaction: str | None
    material: MaterialRead
    created_at: datetime
    updated_at: datetime
