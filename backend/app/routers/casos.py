from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_usuario_atual
from app.models.usuario import Usuario
from app.schemas.caso import CasoCreate, CasoResponse, CasoUpdate
from app.services.caso_service import (
    ClienteNaoEncontradoError,
    atualizar_caso,
    buscar_caso,
    criar_caso,
    inativar_caso,
    listar_casos,
)


router = APIRouter(
    prefix="/api/casos",
    tags=["Casos"],
)


@router.post("/", response_model=CasoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_caso(
    dados: CasoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """Cadastra um novo caso vinculado a um cliente ativo. Requer autenticação."""
    try:
        return criar_caso(
            db=db,
            cliente_id=dados.cliente_id,
            titulo=dados.titulo,
            tipo_atendimento=dados.tipo_atendimento,
            observacoes=dados.observacoes,
        )
    except ClienteNaoEncontradoError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.get("/", response_model=list[CasoResponse])
def listar(
    cliente_id: int | None = None,
    tipo_atendimento: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """
    Lista casos ativos, com filtros opcionais:
    cliente_id, tipo_atendimento e q (busca em título e observações).

    Requer autenticação.
    """
    return listar_casos(
        db=db, cliente_id=cliente_id, tipo_atendimento=tipo_atendimento, q=q
    )


@router.get("/{caso_id}", response_model=CasoResponse)
def buscar(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """Busca um caso ativo pelo ID. Requer autenticação."""
    caso = buscar_caso(db=db, caso_id=caso_id)
    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caso não encontrado.")
    return caso


@router.put("/{caso_id}", response_model=CasoResponse)
def atualizar(
    caso_id: int,
    dados: CasoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """Atualiza os dados de um caso. Requer autenticação."""
    caso = atualizar_caso(
        db=db,
        caso_id=caso_id,
        campos=dados.model_dump(exclude_unset=True),
    )
    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caso não encontrado.")
    return caso


@router.delete("/{caso_id}")
def inativar(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """Inativa um caso (soft delete). Requer autenticação."""
    caso = inativar_caso(db=db, caso_id=caso_id)
    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Caso não encontrado.")
    return {"message": "Caso inativado com sucesso.", "caso_id": caso.id}
