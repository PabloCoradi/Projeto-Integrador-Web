from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.usuario import Usuario


def autenticar_usuario(
    db: Session,
    email: str,
    senha: str,
) -> Usuario | None:
    email = email.strip().lower()

    usuario = db.scalar(
        select(Usuario).where(
            Usuario.email == email,
            Usuario.ativo.is_(True),
        )
    )

    if usuario is None:
        return None

    if not verify_password(senha, usuario.senha_hash):
        return None

    return usuario