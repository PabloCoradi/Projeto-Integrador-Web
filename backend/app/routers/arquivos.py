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
from app.schemas.arquivo_caso import (
    ArquivoCasoResponse,
    ArquivoCasoUpdate,
    ArquivoLinkResponse,
)
from app.services.arquivo_service import (
    ArquivoInvalidoError,
    CasoNaoEncontradoError,
    anexar_arquivo,
    atualizar_tag_arquivo,
    buscar_arquivo,
    gerar_link,
    inativar_arquivo,
    listar_arquivos,
)
from app.services.caso_service import buscar_caso
from app.services.storage_service import FalhaStorageError


router = APIRouter(
    prefix="/api/casos/{caso_id}/arquivos",
    tags=["Arquivos dos casos"],
)


@router.post(
    "/",
    response_model=ArquivoCasoResponse,
    status_code=status.HTTP_201_CREATED,
)
def anexar(
    caso_id: int,
    arquivo: UploadFile = File(...),
    tag: str = Form(""),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    try:
        return anexar_arquivo(
            db=db,
            caso_id=caso_id,
            usuario_id=usuario.id,
            arquivo=arquivo,
            tag=tag,
        )
    except CasoNaoEncontradoError as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        )
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
    "/",
    response_model=list[ArquivoCasoResponse],
)
def listar(
    caso_id: int,
    tag: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    if buscar_caso(db=db, caso_id=caso_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso não encontrado.",
        )

    try:
        return listar_arquivos(db=db, caso_id=caso_id, tag=tag)
    except ArquivoInvalidoError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        )


@router.get(
    "/{arquivo_id}/link",
    response_model=ArquivoLinkResponse,
)
def link_download(
    caso_id: int,
    arquivo_id: int,
    inline: bool = False,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "visualizar")),
):
    arquivo = buscar_arquivo(
        db=db,
        caso_id=caso_id,
        arquivo_id=arquivo_id,
    )

    if arquivo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado.",
        )

    try:
        return gerar_link(arquivo, inline=inline)
    except FalhaStorageError as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        )


@router.patch(
    "/{arquivo_id}",
    response_model=ArquivoCasoResponse,
)
def alterar_tag(
    caso_id: int,
    arquivo_id: int,
    dados: ArquivoCasoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    arquivo = atualizar_tag_arquivo(
        db=db,
        caso_id=caso_id,
        arquivo_id=arquivo_id,
        tag=dados.tag,
    )

    if arquivo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado.",
        )

    return arquivo


@router.delete("/{arquivo_id}")
def inativar(
    caso_id: int,
    arquivo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("casos", "editar")),
):
    arquivo = inativar_arquivo(
        db=db,
        caso_id=caso_id,
        arquivo_id=arquivo_id,
    )

    if arquivo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado.",
        )

    return {
        "message": "Arquivo inativado com sucesso.",
        "arquivo_id": arquivo.id,
    }
