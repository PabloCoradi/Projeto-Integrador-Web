from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import exigir_permissao
from app.core.imagens_padrao import IMAGENS_PADRAO
from app.models.usuario import Usuario
from app.schemas.imagem_artigo import ImagemArtigoResponse, ImagemPadraoResponse
from app.services.imagem_artigo_service import (
    ImagemEmUsoError,
    ImagemInvalidaError,
    buscar_imagem,
    enviar_imagem,
    inativar_imagem,
    listar_imagens,
)
from app.services.storage_service import FalhaStorageError, baixar_arquivo


# Galeria administrativa (permissão no módulo de artigos)
router = APIRouter(
    prefix="/api/imagens-artigos",
    tags=["Imagens dos artigos"],
)

# Entrega pública das imagens para o site (sem login). Só serve imagens de
# artigos: os arquivos de casos e de clientes nunca passam por aqui.
router_publico = APIRouter(
    prefix="/api/public/imagens-artigos",
    tags=["Imagens dos artigos"],
)

# Uma imagem enviada nunca muda de conteúdo (trocar = enviar outra), então o
# navegador pode guardar em cache por bastante tempo.
CACHE_IMAGEM_ENVIADA = "public, max-age=31536000, immutable"
CACHE_IMAGEM_PADRAO = "public, max-age=86400"

# SVGs são servidos como imagem, sem permitir scripts nem conteúdo externo
CABECALHOS_SEGURANCA = {
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
}


@router.get(
    "",
    response_model=list[ImagemArtigoResponse],
)
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "visualizar")),
):
    return listar_imagens(db)


@router.post(
    "",
    response_model=ImagemArtigoResponse,
    status_code=status.HTTP_201_CREATED,
)
def enviar(
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
):
    try:
        return enviar_imagem(db=db, usuario_id=usuario.id, arquivo=arquivo)
    except ImagemInvalidaError as erro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro),
        ) from erro
    except FalhaStorageError as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        ) from erro


@router.delete(
    "/{imagem_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remover(
    imagem_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
) -> Response:
    try:
        imagem = inativar_imagem(db=db, imagem_id=imagem_id)
    except ImagemEmUsoError as erro:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        ) from erro

    if imagem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# As rotas /padrao vêm antes de /{imagem_id} para não serem confundidas com um id
@router_publico.get(
    "/padrao",
    response_model=list[ImagemPadraoResponse],
)
def listar_padrao():
    return list(IMAGENS_PADRAO.values())


@router_publico.get("/padrao/{chave}")
def imagem_padrao(chave: str):
    imagem = IMAGENS_PADRAO.get(chave)

    if imagem is None or not imagem.caminho.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada.",
        )

    return FileResponse(
        imagem.caminho,
        media_type=imagem.content_type,
        headers={"Cache-Control": CACHE_IMAGEM_PADRAO, **CABECALHOS_SEGURANCA},
    )


@router_publico.get("/{imagem_id}")
def imagem_enviada(
    imagem_id: int,
    db: Session = Depends(get_db),
):
    imagem = buscar_imagem(db=db, imagem_id=imagem_id)

    if imagem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada.",
        )

    try:
        partes, _, tamanho = baixar_arquivo(imagem.chave_storage)
    except FalhaStorageError as erro:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(erro),
        ) from erro

    cabecalhos = {"Cache-Control": CACHE_IMAGEM_ENVIADA, **CABECALHOS_SEGURANCA}

    if tamanho is not None:
        cabecalhos["Content-Length"] = str(tamanho)

    # O tipo vem do banco (sempre image/webp), não do armazenamento
    return StreamingResponse(
        partes,
        media_type=imagem.content_type,
        headers=cabecalhos,
    )
