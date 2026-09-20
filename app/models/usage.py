from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.material import Material

USAGE_STATUSES = ("计划", "已用", "未用")
USAGE_EFFECTS = ("未评", "好", "差")


class Usage(Base):
    """使用记录：连接场次与素材。

    Task 3 只建立备课阶段的“计划”事实；状态与效果的转换属于 Task 4。
    """

    __tablename__ = "usages"
    __table_args__ = (
        CheckConstraint("status IN ('计划','已用','未用')", name="usages_status_valid"),
        CheckConstraint("effect IN ('未评','好','差')", name="usages_effect_valid"),
        CheckConstraint("reaction IS NULL OR length(btrim(reaction)) > 0",
                        name="usages_reaction_nonblank"),
        UniqueConstraint("session_id", "material_id", name="uq_usages_session_material"),
        Index("ix_usages_session_id", "session_id"),
        Index("ix_usages_material_id", "material_id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("sessions.id", name="fk_usages_session_id"),
        nullable=False,
    )
    material_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("materials.id", name="fk_usages_material_id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="计划")
    effect: Mapped[str] = mapped_column(String(20), nullable=False, server_default="未评")
    reaction: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                 server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                 server_default=func.now(), onupdate=func.now())

    material: Mapped[Material] = relationship(lazy="joined")
