"""Task 2 customers, courses, vocabularies and teaching sessions.

Revision ID: 0002_customers_courses_sessions
Revises: 0001_materials
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0002_customers_courses_sessions"
down_revision = "0001_materials"
branch_labels = None
depends_on = None

TS = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "industries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", TS, server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(btrim(name)) > 0", name="industries_name_nonblank"),
        sa.UniqueConstraint("name", name="uq_industries_name"),
    )

    op.create_table(
        "audience_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", TS, server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(btrim(name)) > 0", name="audience_types_name_nonblank"),
        sa.UniqueConstraint("name", name="uq_audience_types_name"),
    )

    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("short_name", sa.String(length=255), nullable=True),
        sa.Column("industry_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("group_name", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", TS, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", TS, server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(btrim(name)) > 0", name="customers_name_nonblank"),
        sa.ForeignKeyConstraint(["industry_id"], ["industries.id"],
                                name="fk_customers_industry_id"),
        sa.UniqueConstraint("name", name="uq_customers_name"),
    )
    op.create_index("ix_customers_industry_id", "customers", ["industry_id"])

    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("alias", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="启用", nullable=False),
        sa.Column("created_at", TS, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", TS, server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(btrim(name)) > 0", name="courses_name_nonblank"),
        sa.CheckConstraint("status IN ('启用','停用')", name="courses_status_valid"),
    )

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("audience_description", sa.Text(), nullable=True),
        sa.Column("duration", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", TS, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", TS, server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("duration IN ('半天','一天','两天','其他')",
                           name="sessions_duration_valid"),
        sa.CheckConstraint(
            "audience_description IS NULL OR length(btrim(audience_description)) > 0",
            name="sessions_audience_description_nonblank"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"],
                                name="fk_sessions_customer_id"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], name="fk_sessions_course_id"),
    )
    op.create_index("ix_sessions_session_date_id", "sessions", ["session_date", "id"])
    op.create_index("ix_sessions_customer_id", "sessions", ["customer_id"])
    op.create_index("ix_sessions_course_id", "sessions", ["course_id"])

    op.create_table(
        "session_audiences",
        sa.Column("session_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("audience_type_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE",
                                name="fk_session_audiences_session_id"),
        sa.ForeignKeyConstraint(["audience_type_id"], ["audience_types.id"],
                                name="fk_session_audiences_audience_type_id"),
    )
    op.create_index("ix_session_audiences_audience_type_id", "session_audiences",
                    ["audience_type_id"])


def downgrade() -> None:
    op.drop_index("ix_session_audiences_audience_type_id", table_name="session_audiences")
    op.drop_table("session_audiences")
    op.drop_index("ix_sessions_course_id", table_name="sessions")
    op.drop_index("ix_sessions_customer_id", table_name="sessions")
    op.drop_index("ix_sessions_session_date_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("courses")
    op.drop_index("ix_customers_industry_id", table_name="customers")
    op.drop_table("customers")
    op.drop_table("audience_types")
    op.drop_table("industries")
