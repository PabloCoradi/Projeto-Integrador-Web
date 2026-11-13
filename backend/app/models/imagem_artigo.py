from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.imagens_padrao import url_imagem_enviada
from app.core.tempo import agora_utc


class ImagemArtigo(Base):
    """Imagem enviada para a galeria de capas dos artigos."""

    __tablename__ = "imagem_artigo"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
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

    largura: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    altura: Mapped[int] = mapped_column(
        Integer,
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
        default=agora_utc,
    )

    @property
    def url(self) -> str:
        return url_imagem_enviada(self.id)
