
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import get_usuario_atual
from app.core.security import criar_access_token
from app.core.limiter import limiter

from app.models.usuario import Usuario
from app.schemas.auth import (
    LoginRequest,
    RedefinirSenhaRequest,
    TokenResponse,
)
from app.services.auth_service import (
    autenticar_usuario,
    redefinir_senha,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"],
)


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


@router.post("/redefinir-senha")
def redefinir_senha_endpoint(
    dados: RedefinirSenhaRequest,
    db: Session = Depends(get_db),
):
    try:
        mensagem = redefinir_senha(
            db=db,
            email=dados.email,
            nova_senha=dados.nova_senha,
            confirmar_senha=dados.confirmar_senha,
        )

        return {"message": mensagem}

    except ValueError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        )

    except LookupError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        )


@router.get("/me")
def usuario_atual(
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .options(selectinload(Usuario.permissoes))
        .filter(Usuario.id == usuario.id)
        .first()
    )

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "ativo": usuario.ativo,
        "is_admin": usuario.is_admin,
        "permissoes": [
            {
                "modulo": permissao.modulo,
                "pode_visualizar": permissao.pode_visualizar,
                "pode_editar": permissao.pode_editar,
            }
            for permissao in usuario.permissoes
        ],
    }
