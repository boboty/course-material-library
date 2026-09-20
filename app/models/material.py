from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

MATERIAL_TYPES = ("故事", "案例", "Demo", "金句", "段子", "行业素材")
MATERIAL_STATUSES = ("草稿", "可用", "主力", "待更新", "退役")


class Material(Base):
    __tablename__ = "materials"
    __table_args__ = (
        CheckConstraint("length(btrim(title)) > 0", name="materials_title_nonblank"),
        CheckConstraint("type IS NULL OR type IN ('故事','案例','Demo','金句','段子','行业素材')",
                        name="materials_type_valid"),
        CheckConstraint("status IN ('草稿','可用','主力','待更新','退役')",
                        name="materials_status_valid"),
        CheckConstraint("body IS NULL OR length(btrim(body)) > 0",
                        name="materials_body_nonblank"),
        CheckConstraint("status = '草稿' OR (type IS NOT NULL AND body IS NOT NULL)",
                        name="materials_non_draft_complete"),
        Index("ix_materials_created_id", "created_at", "id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="草稿")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                   server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                   server_default=func.now(), onupdate=func.now())
