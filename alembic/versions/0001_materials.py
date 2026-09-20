"""Task 1 materials core.

Revision ID: 0001_materials
Revises:
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0001_materials"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "materials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="草稿", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(btrim(title)) > 0", name="materials_title_nonblank"),
        sa.CheckConstraint(
            "type IS NULL OR type IN ('故事','案例','Demo','金句','段子','行业素材')",
            name="materials_type_valid"),
        sa.CheckConstraint("status IN ('草稿','可用','主力','待更新','退役')",
                           name="materials_status_valid"),
        sa.CheckConstraint("body IS NULL OR length(btrim(body)) > 0",
                           name="materials_body_nonblank"),
        sa.CheckConstraint("status = '草稿' OR (type IS NOT NULL AND body IS NOT NULL)",
                           name="materials_non_draft_complete"),
    )
    op.create_index("ix_materials_created_id", "materials", ["created_at", "id"])


def downgrade() -> None:
    op.drop_index("ix_materials_created_id", table_name="materials")
    op.drop_table("materials")
