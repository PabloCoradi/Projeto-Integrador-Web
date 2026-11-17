"""criar tabela documento_cliente

Revision ID: e3a7c1d5f9b2
Revises: d9132ec92f73
Create Date: 2026-11-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3a7c1d5f9b2'
down_revision: Union[str, Sequence[str], None] = 'd9132ec92f73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('documento_cliente',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('cliente_id', sa.Integer(), nullable=False),
    sa.Column('enviado_por_id', sa.Integer(), nullable=False),
    sa.Column('tag', sa.String(length=50), nullable=False),
    sa.Column('nome_original', sa.String(length=255), nullable=False),
    sa.Column('chave_storage', sa.String(length=500), nullable=False),
    sa.Column('content_type', sa.String(length=150), nullable=False),
    sa.Column('tamanho_bytes', sa.BigInteger(), nullable=False),
    sa.Column('ativo', sa.Boolean(), nullable=False),
    sa.Column('criado_em', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['cliente_id'], ['cliente.id'], ),
    sa.ForeignKeyConstraint(['enviado_por_id'], ['usuario.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('chave_storage')
    )
    op.create_index(op.f('ix_documento_cliente_cliente_id'), 'documento_cliente', ['cliente_id'], unique=False)
    op.create_index(op.f('ix_documento_cliente_tag'), 'documento_cliente', ['tag'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_documento_cliente_tag'), table_name='documento_cliente')
    op.drop_index(op.f('ix_documento_cliente_cliente_id'), table_name='documento_cliente')
    op.drop_table('documento_cliente')
