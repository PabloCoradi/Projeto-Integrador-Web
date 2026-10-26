from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.artigo import ArtigoPublicPageResponse, ArtigoPublicResponse
from app.services.artigo_service import (
    buscar_artigo_publico_por_slug,
    listar_artigos_publicos,
)


router = APIRouter(
    prefix="/api/public/artigos",
    tags=["Artigos públicos"],
)


@router.get(
    "",
    response_model=ArtigoPublicPageResponse,
)
def listar_publicacoes(
    page: Annotated[int, Query(ge=1)] = 1,
    por_pagina: Annotated[int, Query(ge=1, le=100)] = 10,
    db: Session = Depends(get_db),
):
    """Lista artigos publicados sem exigir autenticação."""

    artigos, total = listar_artigos_publicos(
        db=db,
        page=page,
        por_pagina=por_pagina,
    )

    return {
        "items": artigos,
        "page": page,
        "por_pagina": por_pagina,
        "total": total,
        "total_paginas": (total + por_pagina - 1) // por_pagina,
    }


@router.get(
    "/{slug}",
    response_model=ArtigoPublicResponse,
)
def consultar_publicacao(
    slug: str,
    db: Session = Depends(get_db),
):
    """Consulta um artigo publicado pelo slug."""

    artigo = buscar_artigo_publico_por_slug(db=db, slug=slug)

    if artigo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artigo publicado não encontrado.",
        )

    return artigo
