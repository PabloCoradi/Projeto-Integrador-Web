from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.tempo import agora_utc
from app.models.usuario import Usuario

class Artigo(Base):
    __tablename__ = "artigo"
    __table_args__ = (
        CheckConstraint(
            "status IN ('rascunho', 'publicado')",
            name="ck_artigo_status_valido",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    autor_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    titulo: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(260),
        nullable=False,
        unique=True,
        index=True,
    )

    resumo: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    conteudo: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="rascunho",
        index=True,
    )

    publicado_em: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    excluido_em: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora_utc,
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=agora_utc,
        onupdate=agora_utc,
    )

    autor: Mapped["Usuario"] = relationship()
