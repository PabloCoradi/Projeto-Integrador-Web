from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.imagens_padrao import buscar_imagem_padrao, url_imagem_enviada
from app.core.tempo import agora_utc
from app.models.imagem_artigo import ImagemArtigo  # noqa: F401  (registra a tabela)
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

    # Capa: uma imagem enviada (galeria) OU uma imagem padrão. Sem nenhuma
    # das duas, o site usa a imagem padrão geral.
    imagem_id: Mapped[int | None] = mapped_column(
        ForeignKey("imagem_artigo.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    imagem_padrao: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    imagem_alt: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
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

    @property
    def imagem_url(self) -> str:
        """Endereço (relativo à API) da capa que o site deve mostrar."""

        if self.imagem_id is not None:
            return url_imagem_enviada(self.imagem_id)

        return buscar_imagem_padrao(self.imagem_padrao).url

    @property
    def imagem_alt_publico(self) -> str:
        """Texto alternativo da capa; sem texto próprio, usa o da imagem padrão."""

        if self.imagem_alt:
            return self.imagem_alt

        if self.imagem_id is not None:
            return ""

        return buscar_imagem_padrao(self.imagem_padrao).texto_alternativo
