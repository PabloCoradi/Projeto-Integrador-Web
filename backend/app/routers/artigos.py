from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import exigir_permissao
from app.models.usuario import Usuario
from app.schemas.artigo import (
    ArtigoAdminPageResponse,
    ArtigoAdminResponse,
    ArtigoCreate,
    ArtigoStatus,
    ArtigoUpdate,
)
from app.services.artigo_service import (
    ArtigoInvalidoError,
    ArtigoConflitoError,
    ArtigoNaoEncontradoError,
    ArtigoPublicacaoError,
    AutorInvalidoError,
    atualizar_artigo,
    buscar_artigo,
    criar_artigo,
    despublicar_artigo,
    excluir_artigo,
    listar_artigos,
    publicar_artigo,
)

router = APIRouter(
    prefix="/api/artigos",
    tags=["Artigos"],
)


def _http_error(erro: Exception) -> HTTPException:
    if isinstance(erro, ArtigoNaoEncontradoError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro),
        )

    if isinstance(erro, AutorInvalidoError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro),
        )

    if isinstance(erro, ArtigoConflitoError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro),
        )

    if isinstance(erro, (ArtigoInvalidoError, ArtigoPublicacaoError)):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(erro),
        )

    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(erro),
    )


@router.post(
    "",
    response_model=ArtigoAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_artigo(
    dados: ArtigoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
):
    try:
        return criar_artigo(
            db=db,
            autor_id=usuario.id,
            titulo=dados.titulo,
            resumo=dados.resumo,
            conteudo=dados.conteudo,
        )
    except (
        ArtigoConflitoError,
        ArtigoInvalidoError,
        AutorInvalidoError,
    ) as erro:
        raise _http_error(erro) from erro


@router.get(
    "",
    response_model=ArtigoAdminPageResponse,
)
def listar_artigos_administrativos(
    page: Annotated[int, Query(ge=1)] = 1,
    por_pagina: Annotated[int, Query(ge=1, le=100)] = 10,
    status_artigo: Annotated[
        ArtigoStatus | None,
        Query(alias="status"),
    ] = None,
    q: Annotated[str | None, Query(max_length=250)] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "visualizar")),
):
    artigos, total = listar_artigos(
        db=db,
        page=page,
        por_pagina=por_pagina,
        status=status_artigo,
        q=q,
    )

    return {
        "items": artigos,
        "page": page,
        "por_pagina": por_pagina,
        "total": total,
        "total_paginas": (total + por_pagina - 1) // por_pagina,
    }


@router.get(
    "/{artigo_id}",
    response_model=ArtigoAdminResponse,
)
def consultar_artigo(
    artigo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "visualizar")),
):
    artigo = buscar_artigo(db=db, artigo_id=artigo_id)

    if artigo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artigo não encontrado.",
        )

    return artigo


@router.patch(
    "/{artigo_id}",
    response_model=ArtigoAdminResponse,
)
def editar_artigo(
    artigo_id: int,
    dados: ArtigoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
):
    try:
        return atualizar_artigo(
            db=db,
            artigo_id=artigo_id,
            campos=dados.model_dump(exclude_unset=True),
        )
    except (
        ArtigoInvalidoError,
        ArtigoNaoEncontradoError,
        ArtigoPublicacaoError,
    ) as erro:
        raise _http_error(erro) from erro


@router.post(
    "/{artigo_id}/publicar",
    response_model=ArtigoAdminResponse,
)
def publicar(
    artigo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
):
    try:
        return publicar_artigo(db=db, artigo_id=artigo_id)
    except (ArtigoNaoEncontradoError, ArtigoPublicacaoError) as erro:
        raise _http_error(erro) from erro


@router.post(
    "/{artigo_id}/despublicar",
    response_model=ArtigoAdminResponse,
)
def despublicar(
    artigo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
):
    try:
        return despublicar_artigo(db=db, artigo_id=artigo_id)
    except ArtigoNaoEncontradoError as erro:
        raise _http_error(erro) from erro


@router.delete(
    "/{artigo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remover_artigo(
    artigo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("artigos", "editar")),
) -> Response:
    try:
        excluir_artigo(db=db, artigo_id=artigo_id)
    except ArtigoNaoEncontradoError as erro:
        raise _http_error(erro) from erro

    return Response(status_code=status.HTTP_204_NO_CONTENT)
