from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import exigir_permissao
from app.models.usuario import Usuario
from app.schemas.arquivo_caso import ArquivoLinkResponse
from app.schemas.documento_cliente import (
    DocumentoClienteResponse,
    DocumentoClienteUpdate,
)
from app.services.arquivo_service import ArquivoInvalidoError, gerar_link
from app.services.cliente_service import buscar_cliente
from app.services.documento_cliente_service import (
    ClienteNaoEncontradoError,
    anexar_documento,
    atualizar_tag,
    buscar_documento,
    buscar_documento_do_caso,
    inativar_documento,
    listar_documentos,
    listar_documentos_do_caso,
    listar_tags,
)
from app.services.storage_service import FalhaStorageError


router = APIRouter(
    prefix="/api/clientes",
    tags=["Documentos dos clientes"],
)

# Leitura dos documentos do cliente a partir de um caso (permissão de casos)
router_casos = APIRouter(
    prefix="/api/casos/{caso_id}/documentos-cliente",
    tags=["Documentos dos clientes"],
)


def _nao_encontrado(mensagem: str = "Documento não encontrado.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=mensagem,
    )


def _gerar_link(documento, inline: bool) -> dict:
    try:
        return gerar_link(documento, inline=inline)
    except FalhaStorageError as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        )


@router.get(
    "/documentos/tags",
    response_model=list[str],
)
def tags_usadas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    return listar_tags(db)


@router.post(
    "/{cliente_id}/documentos/",
    response_model=DocumentoClienteResponse,
    status_code=status.HTTP_201_CREATED,
)
def anexar(
    cliente_id: int,
    arquivo: UploadFile = File(...),
    tag: str = Form(""),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    try:
        return anexar_documento(
            db=db,
            cliente_id=cliente_id,
            usuario_id=usuario.id,
            arquivo=arquivo,
            tag=tag,
        )
    except ClienteNaoEncontradoError as erro:
        raise _nao_encontrado(str(erro))
    except ArquivoInvalidoError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        )
    except FalhaStorageError as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        )


@router.get(
    "/{cliente_id}/documentos/",
    response_model=list[DocumentoClienteResponse],
)
def listar(
    cliente_id: int,
    tag: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    if buscar_cliente(db=db, cliente_id=cliente_id) is None:
        raise _nao_encontrado("Cliente não encontrado.")

    try:
        return listar_documentos(db=db, cliente_id=cliente_id, tag=tag)
    except ArquivoInvalidoError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        )


@router.get(
    "/{cliente_id}/documentos/{documento_id}/link",
    response_model=ArquivoLinkResponse,
)
def link_download(
    cliente_id: int,
    documento_id: int,
    inline: bool = False,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "visualizar")),
):
    documento = buscar_documento(
        db=db,
        cliente_id=cliente_id,
        documento_id=documento_id,
    )

    if documento is None:
        raise _nao_encontrado()

    return _gerar_link(documento, inline)


@router.patch(
    "/{cliente_id}/documentos/{documento_id}",
    response_model=DocumentoClienteResponse,
)
def alterar_tag(
    cliente_id: int,
    documento_id: int,
    dados: DocumentoClienteUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    documento = atualizar_tag(
        db=db,
        cliente_id=cliente_id,
        documento_id=documento_id,
        tag=dados.tag,
    )

    if documento is None:
        raise _nao_encontrado()

    return documento


@router.delete("/{cliente_id}/documentos/{documento_id}")
def inativar(
    cliente_id: int,
    documento_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("clientes", "editar")),
):
    documento = inativar_documento(
        db=db,
        cliente_id=cliente_id,
        documento_id=documento_id,
    )

    if documento is None:
        raise _nao_encontrado()

    return {
        "message": "Documento inativado com sucesso.",
        "documento_id": documento.id,
    }


@router_casos.get(
    "/",
    response_model=list[DocumentoClienteResponse],
)
def listar_do_caso(
    caso_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    documentos = listar_documentos_do_caso(db=db, caso_id=caso_id)

    if documentos is None:
        raise _nao_encontrado("Caso não encontrado.")

    return documentos


@router_casos.get(
    "/{documento_id}/link",
    response_model=ArquivoLinkResponse,
)
def link_download_do_caso(
    caso_id: int,
    documento_id: int,
    inline: bool = False,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    documento = buscar_documento_do_caso(
        db=db,
        caso_id=caso_id,
        documento_id=documento_id,
    )

    if documento is None:
        raise _nao_encontrado()

    return _gerar_link(documento, inline)
