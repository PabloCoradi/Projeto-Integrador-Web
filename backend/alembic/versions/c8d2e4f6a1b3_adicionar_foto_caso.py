"""Adicionar foto de identificação à pasta do caso."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d2e4f6a1b3"
down_revision: Union[str, Sequence[str], None] = "a1c5e9f3b7d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "caso",
        sa.Column("foto_chave_storage", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("caso", "foto_chave_storage")
