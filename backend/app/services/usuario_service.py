from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.usuario import Usuario


def criar_usuario(
    db: Session,
    nome: str,
    email: str,
    senha: str,
) -> Usuario:
    email = email.strip().lower()

    usuario_existente = db.scalar(
        select(Usuario).where(Usuario.email == email)
    )

    if usuario_existente:
        raise ValueError("Já existe um usuário com este e-mail.")

    usuario = Usuario(
        nome=nome.strip(),
        email=email,
        senha_hash=hash_password(senha),
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario