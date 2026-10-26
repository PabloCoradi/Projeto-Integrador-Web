from fastapi import APIRouter, Depends, HTTPException, status
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
)

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
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    return listar_clientes(db)


@router.get(
    "/{cliente_id}",
    response_model=ClienteResponse,
)
def buscar(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    cliente = buscar_cliente(db=db, cliente_id=cliente_id)

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )

    return cliente


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
    cliente = inativar_cliente(db=db, cliente_id=cliente_id)

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )

    return {
        "message": "Cliente inativado com sucesso.",
        "cliente_id": cliente.id,
    }
