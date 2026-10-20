
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.usuario import Usuario


def criar_usuario(
    db: Session,
    nome: str,
    email: str,
    senha: str,
) -> Usuario:

    nome = nome.strip()
    email = email.strip().lower()

    # Validação do nome
    if not nome:
        raise ValueError("O nome é obrigatório.")

    if len(nome) > 150:
        raise ValueError("O nome deve ter no máximo 150 caracteres.")

    # Validação do e-mail
    try:
        email = TypeAdapter(EmailStr).validate_python(email).lower()
    except ValidationError:
        raise ValueError("Informe um e-mail válido.") from None

    if len(email) > 255:
        raise ValueError("O e-mail deve ter no máximo 255 caracteres.")

    # Validação da senha
    if len(senha) < 8:
        raise ValueError("A senha deve ter pelo menos 8 caracteres.")

    if len(senha) > 128:
        raise ValueError("A senha deve ter no máximo 128 caracteres.")

    # Verifica se o e-mail já existe
    usuario_existente = db.scalar(
        select(Usuario).where(Usuario.email == email)
    )

    if usuario_existente:
        raise ValueError("Já existe um usuário com este e-mail.")

    # Cria o usuário com a senha protegida
    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=hash_password(senha),
    )

    try:
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "Já existe um usuário com este e-mail."
        ) from None

    except Exception:
        db.rollback()
        raise

    return usuario
