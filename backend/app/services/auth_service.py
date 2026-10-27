
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password, hash_password
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


def redefinir_senha(
    db: Session,
    email: str,
    nova_senha: str,
    confirmar_senha: str,
) -> str:
    email = email.strip().lower()

    if nova_senha != confirmar_senha:
        raise ValueError("As senhas não coincidem.")

    usuario = db.scalar(
        select(Usuario).where(
            Usuario.email == email,
            Usuario.ativo.is_(True),
        )
    )

    if usuario is None:
        raise LookupError("E-mail não encontrado.")

    usuario.senha_hash = hash_password(nova_senha)

    db.commit()

    return "Senha alterada com sucesso."
