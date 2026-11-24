from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import exigir_permissao
from app.models.usuario import Usuario
from app.schemas.caso import CasoCreate, CasoResponse, CasoUpdate
from app.services.caso_service import (
    ClienteInativoError,
    ClienteNaoEncontradoError,
    atualizar_caso,
    buscar_caso,
    criar_caso,
    inativar_caso,
    listar_casos,
    reativar_caso,
)
from app.services.foto_caso_service import (
    CasoFotoNaoEncontradoError,
    FotoCasoInvalidaError,
    gerar_link_foto_caso,
    remover_foto_caso,
    salvar_foto_caso,
)
from app.services.storage_service import FalhaStorageError

router = APIRouter(
    prefix="/api/casos",
    tags=["Casos"],
)


@router.post("/", response_model=CasoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_caso(
    dados: CasoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        )


@router.get("/", response_model=list[CasoResponse])
def listar(
    cliente_id: int | None = None,
    tipo_atendimento: str | None = None,
    q: str | None = None,
    situacao: Literal["ativos", "inativos"] = "ativos",
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    return listar_casos(
        db=db,
        cliente_id=cliente_id,
        tipo_atendimento=tipo_atendimento,
        q=q,
        inativos=situacao == "inativos",
    )


@router.get("/{caso_id}", response_model=CasoResponse)
def buscar(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    caso = buscar_caso(db=db, caso_id=caso_id)

    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso não encontrado.",
        )

    return caso


@router.post("/{caso_id}/foto", response_model=CasoResponse)
def enviar_foto(
    caso_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    try:
        return salvar_foto_caso(db=db, caso_id=caso_id, arquivo=arquivo)
    except CasoFotoNaoEncontradoError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro)) from erro
    except FotoCasoInvalidaError as erro:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(erro)) from erro
    except FalhaStorageError as erro:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(erro)) from erro


@router.get("/{caso_id}/foto/link")
def link_foto(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    try:
        return gerar_link_foto_caso(db=db, caso_id=caso_id)
    except CasoFotoNaoEncontradoError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro)) from erro
    except FalhaStorageError as erro:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(erro)) from erro


@router.delete("/{caso_id}/foto", response_model=CasoResponse)
def excluir_foto(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    try:
        return remover_foto_caso(db=db, caso_id=caso_id)
    except CasoFotoNaoEncontradoError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro)) from erro


@router.put("/{caso_id}", response_model=CasoResponse)
def atualizar(
    caso_id: int,
    dados: CasoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    caso = atualizar_caso(
        db=db,
        caso_id=caso_id,
        campos=dados.model_dump(exclude_unset=True),
    )

    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso não encontrado.",
        )

    return caso


@router.delete("/{caso_id}")
def inativar(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    caso = inativar_caso(db=db, caso_id=caso_id)

    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso não encontrado.",
        )

    return {
        "message": "Caso inativado com sucesso.",
        "caso_id": caso.id,
    }


@router.patch("/{caso_id}/reativar", response_model=CasoResponse)
def reativar(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    try:
        caso = reativar_caso(db=db, caso_id=caso_id)
    except ClienteInativoError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        )

    if caso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso não encontrado.",
        )

    return caso
