"""adicionar tag em arquivo_caso

Revision ID: f4b8d2e6a0c3
Revises: e3a7c1d5f9b2
Create Date: 2026-11-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4b8d2e6a0c3'
down_revision: Union[str, Sequence[str], None] = 'e3a7c1d5f9b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Arquivos já existentes ficam com a tag padrão OUTROS
    op.add_column(
        'arquivo_caso',
        sa.Column('tag', sa.String(length=50), nullable=False, server_default='OUTROS'),
    )
    op.create_index(op.f('ix_arquivo_caso_tag'), 'arquivo_caso', ['tag'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_arquivo_caso_tag'), table_name='arquivo_caso')
    op.drop_column('arquivo_caso', 'tag')
