from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Industry(Base):
    """客户行业基础词表，后续素材适用行业复用同一套值。"""

    __tablename__ = "industries"
    __table_args__ = (
        CheckConstraint("length(btrim(name)) > 0", name="industries_name_nonblank"),
        UniqueConstraint("name", name="uq_industries_name"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                 server_default=func.now())


class AudienceType(Base):
    """场次人群类型基础词表。"""

    __tablename__ = "audience_types"
    __table_args__ = (
        CheckConstraint("length(btrim(name)) > 0", name="audience_types_name_nonblank"),
        UniqueConstraint("name", name="uq_audience_types_name"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                 server_default=func.now())
