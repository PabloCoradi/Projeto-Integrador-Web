from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import exigir_permissao
from app.models.usuario import Usuario
from app.schemas.cliente import (
    ClienteCreate,
    ClienteResponse,
    ClienteUpdate,
)
from app.services.cliente_service import (
    atualizar_cliente,
    buscar_cliente,
    criar_cliente,
    inativar_cliente,
    listar_clientes,
    reativar_cliente,
    SituacaoInvalidaError,
)
from app.services.foto_cliente_service import (
    ClienteFotoNaoEncontradoError,
    FotoClienteInvalidaError,
    gerar_link_foto_cliente,
    remover_foto_cliente,
    salvar_foto_cliente,
)
from app.services.storage_service import FalhaStorageError

router = APIRouter(
    prefix="/api/clientes",
    tags=["Clientes"],
)


@router.post(
    "/",
    response_model=ClienteResponse,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_cliente(
    dados: ClienteCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        return criar_cliente(
            db=db,
            nome=dados.nome,
            cpf_cnpj=dados.cpf_cnpj,
            email=dados.email,
            telefone=dados.telefone,
            endereco=dados.endereco,
            observacoes=dados.observacoes,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        )


@router.get(
    "/",
    response_model=list[ClienteResponse],
)
def listar(
    situacao: Literal["ativos", "inativos"] = "ativos",
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    return listar_clientes(db, inativos=situacao == "inativos")


@router.get(
    "/{cliente_id}",
    response_model=ClienteResponse,
)
def buscar(
    cliente_id: int,
    incluir_inativos: bool = False,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    # incluir_inativos=true serve para a página do cliente, que também
    # consulta (só leitura) clientes inativos.
    cliente = buscar_cliente(
        db=db, cliente_id=cliente_id, incluir_inativos=incluir_inativos
    )

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )

    return cliente


@router.post("/{cliente_id}/foto", response_model=ClienteResponse)
def enviar_foto(
    cliente_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        return salvar_foto_cliente(db=db, cliente_id=cliente_id, arquivo=arquivo)
    except ClienteFotoNaoEncontradoError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except FotoClienteInvalidaError as erro:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(erro))
    except FalhaStorageError as erro:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(erro))


@router.get("/{cliente_id}/foto/link")
def link_foto(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    try:
        return gerar_link_foto_cliente(db=db, cliente_id=cliente_id)
    except ClienteFotoNaoEncontradoError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except FalhaStorageError as erro:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(erro))


@router.delete("/{cliente_id}/foto", response_model=ClienteResponse)
def excluir_foto(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        return remover_foto_cliente(db=db, cliente_id=cliente_id)
    except ClienteFotoNaoEncontradoError as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.put(
    "/{cliente_id}",
    response_model=ClienteResponse,
)
def atualizar(
    cliente_id: int,
    dados: ClienteUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        cliente = atualizar_cliente(
            db=db,
            cliente_id=cliente_id,
            nome=dados.nome,
            cpf_cnpj=dados.cpf_cnpj,
            email=dados.email,
            telefone=dados.telefone,
            endereco=dados.endereco,
            observacoes=dados.observacoes,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        )

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )

    return cliente


@router.delete("/{cliente_id}")
def inativar(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        cliente = inativar_cliente(db=db, cliente_id=cliente_id)
    except SituacaoInvalidaError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        )

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )

    return {
        "message": "Cliente inativado com sucesso.",
        "cliente_id": cliente.id,
    }


@router.patch(
    "/{cliente_id}/reativar",
    response_model=ClienteResponse,
)
def reativar(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        cliente = reativar_cliente(db=db, cliente_id=cliente_id)
    except SituacaoInvalidaError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        )

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )

    return cliente
