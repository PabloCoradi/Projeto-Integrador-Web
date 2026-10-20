
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_usuario_atual
from app.core.security import criar_access_token
from app.core.limiter import limiter

from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import autenticar_usuario


router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"],
)


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
@limiter.limit("5/minute")
def login(
    request: Request,
    dados: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Autentica o usuário e gera um token JWT.

    Limite: 5 tentativas por minuto por endereço IP.
    """

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


# ============================================================
# USUÁRIO AUTENTICADO
# ============================================================

@router.get("/me")
def usuario_atual(
    usuario: Usuario = Depends(get_usuario_atual),
):
    """
    Retorna os dados do usuário autenticado.
    Exige um token JWT válido.
    """

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "ativo": usuario.ativo,
    }
