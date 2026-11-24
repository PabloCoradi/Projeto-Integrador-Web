"""Adicionar foto de identificação ao cadastro do cliente."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9f3a7b1c5e2"
down_revision: Union[str, Sequence[str], None] = "c8d2e4f6a1b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cliente",
        sa.Column("foto_chave_storage", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("cliente", "foto_chave_storage")
