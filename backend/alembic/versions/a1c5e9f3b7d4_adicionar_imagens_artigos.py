"""adicionar imagens de capa dos artigos

Revision ID: a1c5e9f3b7d4
Revises: f4b8d2e6a0c3
Create Date: 2026-11-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c5e9f3b7d4'
down_revision: Union[str, Sequence[str], None] = 'f4b8d2e6a0c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('imagem_artigo',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('enviado_por_id', sa.Integer(), nullable=False),
    sa.Column('nome_original', sa.String(length=255), nullable=False),
    sa.Column('chave_storage', sa.String(length=500), nullable=False),
    sa.Column('content_type', sa.String(length=150), nullable=False),
    sa.Column('tamanho_bytes', sa.BigInteger(), nullable=False),
    sa.Column('largura', sa.Integer(), nullable=False),
    sa.Column('altura', sa.Integer(), nullable=False),
    sa.Column('ativo', sa.Boolean(), nullable=False),
    sa.Column('criado_em', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['enviado_por_id'], ['usuario.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('chave_storage')
    )

    # Artigos já existentes ficam sem imagem escolhida (= imagem padrão geral)
    op.add_column('artigo', sa.Column('imagem_id', sa.Integer(), nullable=True))
    op.add_column('artigo', sa.Column('imagem_padrao', sa.String(length=50), nullable=True))
    op.add_column('artigo', sa.Column('imagem_alt', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_artigo_imagem_id'), 'artigo', ['imagem_id'], unique=False)
    op.create_foreign_key(
        'fk_artigo_imagem_id', 'artigo', 'imagem_artigo',
        ['imagem_id'], ['id'], ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_artigo_imagem_id', 'artigo', type_='foreignkey')
    op.drop_index(op.f('ix_artigo_imagem_id'), table_name='artigo')
    op.drop_column('artigo', 'imagem_alt')
    op.drop_column('artigo', 'imagem_padrao')
    op.drop_column('artigo', 'imagem_id')
    op.drop_table('imagem_artigo')
