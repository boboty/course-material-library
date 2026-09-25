from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.vocabulary import AudienceType, Industry

MATERIAL_TYPES = ("故事", "案例", "Demo", "金句", "段子", "行业素材")
MATERIAL_STATUSES = ("草稿", "可用", "主力", "待更新", "退役")

material_courses = Table(
    "material_courses", Base.metadata,
    Column("material_id", PGUUID(as_uuid=True), ForeignKey("materials.id"), primary_key=True),
    Column("course_id", PGUUID(as_uuid=True), ForeignKey("courses.id"), primary_key=True),
)

material_audience_types = Table(
    "material_audience_types", Base.metadata,
    Column("material_id", PGUUID(as_uuid=True), ForeignKey("materials.id"), primary_key=True),
    Column("audience_type_id", PGUUID(as_uuid=True), ForeignKey("audience_types.id"),
           primary_key=True),
    Index("ix_material_audience_types_audience_type_id", "audience_type_id"),
)

material_industries = Table(
    "material_industries", Base.metadata,
    Column("material_id", PGUUID(as_uuid=True), ForeignKey("materials.id"), primary_key=True),
    Column("industry_id", PGUUID(as_uuid=True), ForeignKey("industries.id"), primary_key=True),
    Index("ix_material_industries_industry_id", "industry_id"),
)


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
    supporting_judgment: Mapped[str | None] = mapped_column(Text, nullable=True)
    speaking_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="草稿")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                   server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                   server_default=func.now(), onupdate=func.now())
    courses: Mapped[list["Course"]] = relationship(secondary=material_courses, lazy="selectin")
    audience_types: Mapped[list[AudienceType]] = relationship(
        secondary=material_audience_types, lazy="selectin")
    industries: Mapped[list[Industry]] = relationship(
        secondary=material_industries, lazy="selectin")


from app.models.course import Course  # noqa: E402
