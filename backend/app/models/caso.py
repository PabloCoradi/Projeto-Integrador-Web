from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.core.database import Base
from app.models.arquivo_caso import ArquivoCaso
from app.models.cliente import Cliente


class Caso(Base):
    __tablename__ = "caso"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("cliente.id"),
        nullable=False,
        index=True,
    )

    titulo: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    tipo_atendimento: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    observacoes: Mapped[str | None] = mapped_column(
        Text,
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

    cliente: Mapped["Cliente"] = relationship()


# Quantidade de arquivos ativos do caso, calculada na mesma consulta que
# busca o caso (usada para destacar o botão "Arquivos" na listagem).
Caso.quantidade_arquivos = column_property(
    select(func.count(ArquivoCaso.id))
    .where(ArquivoCaso.caso_id == Caso.id, ArquivoCaso.ativo.is_(True))
    .correlate_except(ArquivoCaso)
    .scalar_subquery()
)
