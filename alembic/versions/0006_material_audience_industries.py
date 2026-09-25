"""Add material audience and industry associations.

Revision ID: 0006_mat_aud_ind
Revises: 0005_material_courses
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0006_mat_aud_ind"
down_revision = "0005_material_courses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "material_audience_types",
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("audience_type_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"]),
        sa.ForeignKeyConstraint(["audience_type_id"], ["audience_types.id"]),
        sa.PrimaryKeyConstraint("material_id", "audience_type_id"),
    )
    op.create_index("ix_material_audience_types_audience_type_id", "material_audience_types",
                    ["audience_type_id"])
    op.create_table(
        "material_industries",
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("industry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"]),
        sa.ForeignKeyConstraint(["industry_id"], ["industries.id"]),
        sa.PrimaryKeyConstraint("material_id", "industry_id"),
    )
    op.create_index("ix_material_industries_industry_id", "material_industries", ["industry_id"])


def downgrade() -> None:
    op.drop_index("ix_material_industries_industry_id", table_name="material_industries")
    op.drop_table("material_industries")
    op.drop_index("ix_material_audience_types_audience_type_id",
                  table_name="material_audience_types")
    op.drop_table("material_audience_types")
