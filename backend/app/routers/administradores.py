from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_admin_atual
from app.models.usuario import Usuario
from app.schemas.admin import (
    UsuarioAdminCreate,
    UsuarioAdminUpdate,
    UsuarioAdminResponse,
)
from app.services import administrador_service


router = APIRouter(
    prefix="/api/administradores",
    tags=["Administradores"],
)


@router.get("/", response_model=list[UsuarioAdminResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    return administrador_service.listar_usuarios(db)


@router.post(
    "/",
    response_model=UsuarioAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_usuario(
    dados: UsuarioAdminCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    try:
        return administrador_service.criar_usuario(db, dados)
    except ValueError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        ) from erro


@router.get("/{usuario_id}", response_model=UsuarioAdminResponse)
def obter_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    usuario = administrador_service.obter_usuario(db, usuario_id)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    return usuario


@router.put("/{usuario_id}", response_model=UsuarioAdminResponse)
def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioAdminUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    try:
        return administrador_service.atualizar_usuario(
            db,
            usuario_id,
            dados,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        ) from erro


@router.patch("/{usuario_id}/inativar")
def inativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    try:
        administrador_service.desativar_usuario(db, usuario_id)
        return {"mensagem": "Usuário desativado com sucesso."}
    except ValueError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        ) from erro
