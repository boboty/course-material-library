from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
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
from app.models.course import Course
from app.models.customer import Customer
from app.models.vocabulary import AudienceType


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint("duration IN ('半天','一天','两天','其他')",
                        name="sessions_duration_valid"),
        CheckConstraint("audience_description IS NULL OR length(btrim(audience_description)) > 0",
                        name="sessions_audience_description_nonblank"),
        Index("ix_sessions_session_date_id", "session_date", "id"),
        Index("ix_sessions_customer_id", "customer_id"),
        Index("ix_sessions_course_id", "course_id"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    customer_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("customers.id", name="fk_sessions_customer_id"),
        nullable=False,
    )
    course_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("courses.id", name="fk_sessions_course_id"),
        nullable=False,
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    audience_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                 server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,
                                                 server_default=func.now(), onupdate=func.now())

    customer: Mapped[Customer] = relationship(lazy="joined")
    course: Mapped[Course] = relationship(lazy="joined")
    audience_types: Mapped[list[AudienceType]] = relationship(
        secondary="session_audiences", lazy="selectin", order_by="AudienceType.name"
    )


session_audiences = Table(
    "session_audiences",
    Base.metadata,
    Column("session_id", PGUUID(as_uuid=True),
           ForeignKey("sessions.id", ondelete="CASCADE", name="fk_session_audiences_session_id"),
           primary_key=True),
    Column("audience_type_id", PGUUID(as_uuid=True),
           ForeignKey("audience_types.id", name="fk_session_audiences_audience_type_id"),
           primary_key=True),
    Index("ix_session_audiences_audience_type_id", "audience_type_id"),
)


# Descriptive alias: avoids confusion with SQLAlchemy's Session.
TeachingSession = Session
