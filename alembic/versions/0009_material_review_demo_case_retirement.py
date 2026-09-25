"""Add review, demo verification, case category and retirement fields.

Revision ID: 0009_material_fields
Revises: 0008_material_source
"""

import sqlalchemy as sa

from alembic import op

revision = "0009_material_fields"
down_revision = "0008_material_source"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("materials", sa.Column("review_date", sa.Date(), nullable=True))
    op.add_column("materials", sa.Column("demo_verified_on", sa.Date(), nullable=True))
    op.add_column("materials", sa.Column("case_category", sa.String(length=30), nullable=True))
    op.add_column("materials", sa.Column("retirement_reason", sa.Text(), nullable=True))
    op.create_check_constraint(
        "materials_case_category_valid", "materials",
        "case_category IS NULL OR case_category IN ('A 真实案例','B 情境案例')",
    )
    op.create_check_constraint(
        "materials_case_category_type", "materials",
        "type = '案例' OR case_category IS NULL",
    )
    op.create_check_constraint(
        "materials_demo_verified_type", "materials",
        "type = 'Demo' OR demo_verified_on IS NULL",
    )
    op.create_check_constraint(
        "materials_retirement_reason_status", "materials",
        "status = '退役' OR retirement_reason IS NULL",
    )


def downgrade() -> None:
    op.drop_constraint("materials_retirement_reason_status", "materials", type_="check")
    op.drop_constraint("materials_demo_verified_type", "materials", type_="check")
    op.drop_constraint("materials_case_category_type", "materials", type_="check")
    op.drop_constraint("materials_case_category_valid", "materials", type_="check")
    op.drop_column("materials", "retirement_reason")
    op.drop_column("materials", "case_category")
    op.drop_column("materials", "demo_verified_on")
    op.drop_column("materials", "review_date")
