
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


def alterar_minha_senha(
    db: Session,
    usuario: Usuario,
    senha_atual: str,
    nova_senha: str,
    confirmar_senha: str,
) -> str:
    if not verify_password(senha_atual, usuario.senha_hash):
        raise ValueError("A senha atual está incorreta.")

    if nova_senha != confirmar_senha:
        raise ValueError("As senhas não coincidem.")

    if senha_atual == nova_senha:
        raise ValueError("A nova senha deve ser diferente da senha atual.")

    usuario.senha_hash = hash_password(nova_senha)

    db.commit()

    return "Senha alterada com sucesso."
