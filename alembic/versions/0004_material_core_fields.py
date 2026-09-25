"""Add core supplemental material fields.

Revision ID: 0004_material_core_fields
Revises: 0003_usages
"""

import sqlalchemy as sa

from alembic import op

revision = "0004_material_core_fields"
down_revision = "0003_usages"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("materials", sa.Column("supporting_judgment", sa.Text(), nullable=True))
    op.add_column("materials", sa.Column("speaking_notes", sa.Text(), nullable=True))
    op.add_column("materials", sa.Column("source_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("materials", "source_note")
    op.drop_column("materials", "speaking_notes")
    op.drop_column("materials", "supporting_judgment")
