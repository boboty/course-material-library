"""Add optional source material relationship.

Revision ID: 0008_material_source
Revises: 0007_material_tags
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0008_material_source"
down_revision = "0007_material_tags"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "materials",
        sa.Column("source_material_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_materials_source_material_id_materials",
        "materials",
        "materials",
        ["source_material_id"],
        ["id"],
    )
    op.create_check_constraint(
        "materials_source_not_self",
        "materials",
        "source_material_id IS NULL OR source_material_id <> id",
    )


def downgrade() -> None:
    op.drop_constraint("materials_source_not_self", "materials", type_="check")
    op.drop_constraint(
        "fk_materials_source_material_id_materials", "materials", type_="foreignkey"
    )
    op.drop_column("materials", "source_material_id")
