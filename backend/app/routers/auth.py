from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_usuario_atual
from app.core.security import criar_access_token
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import autenticar_usuario


router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    dados: LoginRequest,
    db: Session = Depends(get_db),
):
    usuario = autenticar_usuario(
        db=db,
        email=dados.email,
        senha=dados.senha,
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    access_token = criar_access_token(
        data={
            "sub": str(usuario.id),
            "email": usuario.email,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
)
def usuario_atual(
    usuario: Usuario = Depends(get_usuario_atual),
):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "ativo": usuario.ativo,
    }