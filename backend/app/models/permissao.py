from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Permissao(Base):
    __tablename__ = "permissao"

    __table_args__ = (
        UniqueConstraint(
            "usuario_id",
            "modulo",
            name="uq_permissao_usuario_modulo",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    modulo: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    pode_visualizar: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    pode_editar: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario",
        back_populates="permissoes",
    )
