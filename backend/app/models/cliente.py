from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column

from app.core.database import Base
from app.models.documento_cliente import DocumentoCliente


class Cliente(Base):
    __tablename__ = "cliente"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    cpf_cnpj: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        unique=True,
        index=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    telefone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    endereco: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    observacoes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    foto_chave_storage: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    @property
    def tem_foto(self) -> bool:
        return bool(self.foto_chave_storage)

# Quantidade de documentos ativos do cliente, calculada na mesma consulta que
# busca o cliente (usada para destacar o botão "Documentos" na listagem).
Cliente.quantidade_documentos = column_property(
    select(func.count(DocumentoCliente.id))
    .where(DocumentoCliente.cliente_id == Cliente.id, DocumentoCliente.ativo.is_(True))
    .correlate_except(DocumentoCliente)
    .scalar_subquery()
)
