from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ArquivoCaso(Base):
    __tablename__ = "arquivo_caso"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    caso_id: Mapped[int] = mapped_column(
        ForeignKey("caso.id"),
        nullable=False,
        index=True,
    )

    enviado_por_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id"),
        nullable=False,
    )

    nome_original: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    chave_storage: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        unique=True,
    )

    content_type: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    tamanho_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
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
