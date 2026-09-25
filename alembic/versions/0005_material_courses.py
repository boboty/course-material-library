"""Add material to course associations.

Revision ID: 0005_material_courses
Revises: 0004_material_core_fields
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0005_material_courses"
down_revision = "0004_material_core_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "material_courses",
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("material_id", "course_id"),
    )
    op.create_index("ix_material_courses_course_id", "material_courses", ["course_id"])


def downgrade() -> None:
    op.drop_index("ix_material_courses_course_id", table_name="material_courses")
    op.drop_table("material_courses")
