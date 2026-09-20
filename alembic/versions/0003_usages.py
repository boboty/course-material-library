"""Task 3 planned material usages.

Revision ID: 0003_usages
Revises: 0002_customers_courses_sessions
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0003_usages"
down_revision = "0002_customers_courses_sessions"
branch_labels = None
depends_on = None

TS = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "usages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="计划", nullable=False),
        sa.Column("effect", sa.String(length=20), server_default="未评", nullable=False),
        sa.Column("reaction", sa.Text(), nullable=True),
        sa.Column("created_at", TS, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", TS, server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('计划','已用','未用')", name="usages_status_valid"),
        sa.CheckConstraint("effect IN ('未评','好','差')", name="usages_effect_valid"),
        sa.CheckConstraint("reaction IS NULL OR length(btrim(reaction)) > 0",
                           name="usages_reaction_nonblank"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], name="fk_usages_session_id"),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"], name="fk_usages_material_id"),
        sa.UniqueConstraint("session_id", "material_id", name="uq_usages_session_material"),
    )
    op.create_index("ix_usages_session_id", "usages", ["session_id"])
    op.create_index("ix_usages_material_id", "usages", ["material_id"])


def downgrade() -> None:
    op.drop_index("ix_usages_material_id", table_name="usages")
    op.drop_index("ix_usages_session_id", table_name="usages")
    op.drop_table("usages")
