import re
import unicodedata
from collections.abc import Mapping

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, load_only
from sqlalchemy.sql.elements import ColumnElement

from app.models.artigo import Artigo, agora_utc
from app.models.usuario import Usuario


class ArtigoError(Exception):
    """Erro base das regras de negócio de artigos."""


class ArtigoNaoEncontradoError(ArtigoError):
    pass


class ArtigoInvalidoError(ArtigoError):
    pass


class ArtigoPublicacaoError(ArtigoError):
    pass


class AutorInvalidoError(ArtigoError):
    pass


class ArtigoConflitoError(ArtigoError):
    pass


def _commit_refresh(db: Session, artigo: Artigo) -> Artigo:
    """Confirma a transação e sempre devolve a sessão a um estado utilizável."""
    try:
        db.commit()
        db.refresh(artigo)
    except Exception:
        db.rollback()
        raise

    return artigo


def _conflito_de_slug(erro: IntegrityError) -> bool:
    diagnostico = getattr(getattr(erro, "orig", None), "diag", None)
    return getattr(diagnostico, "constraint_name", None) in {
        "ix_artigo_slug",
        "artigo_slug_key",
    }


def _normalizar_titulo(titulo: str) -> str:
    titulo = titulo.strip()

    if len(titulo) < 2 or len(titulo) > 250:
        raise ArtigoInvalidoError(
            "O título do artigo deve conter entre 2 e 250 caracteres."
        )

    return titulo


def _campos_ausentes_para_publicacao(
    titulo: str,
    resumo: str | None,
    conteudo: str | None,
) -> list[str]:
    return [
        nome
        for nome, valor in (
            ("título", titulo),
            ("resumo", resumo),
            ("conteúdo", conteudo),
        )
        if not valor or not valor.strip()
    ]


def _filtros_de_publicacao() -> list[ColumnElement[bool]]:
    """Condições defensivas para um registro ser exposto publicamente."""

    return [
        Artigo.status == "publicado",
        Artigo.excluido_em.is_(None),
        Artigo.publicado_em.is_not(None),
        Artigo.resumo.is_not(None),
        func.length(func.trim(Artigo.resumo)) > 0,
        Artigo.conteudo.is_not(None),
        func.length(func.trim(Artigo.conteudo)) > 0,
    ]


def gerar_slug_base(titulo: str) -> str:
    """Converte um título em um segmento seguro para URL."""

    texto = unicodedata.normalize("NFKD", titulo)
    texto = "".join(
        caractere
        for caractere in texto
        if not unicodedata.combining(caractere)
    )
    texto = texto.lower()
    texto = re.sub(r"[^a-z0-9]+", "-", texto).strip("-")

    return texto or "artigo"


def gerar_slug_unico(db: Session, titulo: str) -> str:
    """Gera um slug ainda não utilizado, incluindo registros excluídos."""

    base = gerar_slug_base(titulo)[:260].rstrip("-") or "artigo"
    candidato = base
    sufixo = 2

    while db.scalar(
        select(Artigo.id).where(Artigo.slug == candidato)
    ) is not None:
        complemento = f"-{sufixo}"
        prefixo = base[: 260 - len(complemento)].rstrip("-") or "artigo"
        candidato = f"{prefixo}{complemento}"
        sufixo += 1

    return candidato


def buscar_artigo(db: Session, artigo_id: int) -> Artigo | None:
    """Busca um artigo não excluído para uso administrativo."""

    return db.scalar(
        select(Artigo).where(
            Artigo.id == artigo_id,
            Artigo.excluido_em.is_(None),
        )
    )


def listar_artigos(
    db: Session,
    page: int = 1,
    por_pagina: int = 10,
    status: str | None = None,
    q: str | None = None,
) -> tuple[list[Artigo], int]:
    """Lista artigos não excluídos com paginação e filtros administrativos."""

    filtros = [Artigo.excluido_em.is_(None)]

    if status is not None:
        filtros.append(Artigo.status == status)

    if q and q.strip():
        termo = f"%{q.strip()}%"
        filtros.append(
            or_(
                Artigo.titulo.ilike(termo),
                Artigo.resumo.ilike(termo),
                Artigo.conteudo.ilike(termo),
            )
        )

    total = db.scalar(
        select(func.count()).select_from(Artigo).where(*filtros)
    ) or 0
    artigos = list(
        db.scalars(
            select(Artigo)
            .where(*filtros)
            .options(
                load_only(
                    Artigo.id,
                    Artigo.titulo,
                    Artigo.slug,
                    Artigo.status,
                    Artigo.publicado_em,
                    Artigo.atualizado_em,
                )
            )
            .order_by(Artigo.criado_em.desc(), Artigo.id.desc())
            .offset((page - 1) * por_pagina)
            .limit(por_pagina)
        ).all()
    )

    return artigos, total


def listar_artigos_publicos(
    db: Session,
    page: int = 1,
    por_pagina: int = 10,
) -> tuple[list[Artigo], int]:
    """Lista somente publicações completas, ativas e visíveis no site."""

    filtros = _filtros_de_publicacao()
    total = db.scalar(
        select(func.count()).select_from(Artigo).where(*filtros)
    ) or 0
    artigos = list(
        db.scalars(
            select(Artigo)
            .where(*filtros)
            .options(
                load_only(
                    Artigo.titulo,
                    Artigo.slug,
                    Artigo.resumo,
                    Artigo.publicado_em,
                )
            )
            .order_by(Artigo.publicado_em.desc(), Artigo.id.desc())
            .offset((page - 1) * por_pagina)
            .limit(por_pagina)
        ).all()
    )

    return artigos, total


def buscar_artigo_publico_por_slug(
    db: Session,
    slug: str,
) -> Artigo | None:
    """Busca uma publicação visível por seu slug estável."""

    return db.scalar(
        select(Artigo).where(
            Artigo.slug == slug,
            *_filtros_de_publicacao(),
        )
    )


def _buscar_artigo_ou_falhar(db: Session, artigo_id: int) -> Artigo:
    artigo = buscar_artigo(db=db, artigo_id=artigo_id)

    if artigo is None:
        raise ArtigoNaoEncontradoError("Artigo não encontrado.")

    return artigo


def criar_artigo(
    db: Session,
    autor_id: int,
    titulo: str,
    resumo: str | None = None,
    conteudo: str | None = None,
) -> Artigo:
    """Cria um artigo como rascunho e atribui um slug estável."""

    autor = db.scalar(
        select(Usuario).where(
            Usuario.id == autor_id,
            Usuario.ativo.is_(True),
        )
    )

    if autor is None:
        raise AutorInvalidoError("Autor não encontrado ou inativo.")

    titulo = _normalizar_titulo(titulo)
    for tentativa in range(3):
        artigo = Artigo(
            autor_id=autor_id,
            titulo=titulo,
            slug=gerar_slug_unico(db=db, titulo=titulo),
            resumo=resumo,
            conteudo=conteudo,
            status="rascunho",
        )
        db.add(artigo)

        try:
            return _commit_refresh(db=db, artigo=artigo)
        except IntegrityError as erro:
            if not _conflito_de_slug(erro):
                raise

            if tentativa == 2:
                raise ArtigoConflitoError(
                    "Não foi possível reservar uma URL única para o artigo."
                ) from erro

    raise ArtigoConflitoError("Não foi possível criar o artigo.")


def atualizar_artigo(
    db: Session,
    artigo_id: int,
    campos: Mapping[str, str | None],
) -> Artigo:
    """Atualiza campos editoriais sem modificar slug, autoria ou status."""

    campos_permitidos = {"titulo", "resumo", "conteudo"}
    campos_recebidos = set(campos)

    if not campos_recebidos:
        raise ArtigoInvalidoError(
            "Informe ao menos um campo para atualizar o artigo."
        )

    campos_invalidos = campos_recebidos - campos_permitidos

    if campos_invalidos:
        raise ArtigoInvalidoError(
            "Campos não permitidos na atualização: "
            + ", ".join(sorted(campos_invalidos))
            + "."
        )

    artigo = _buscar_artigo_ou_falhar(db=db, artigo_id=artigo_id)

    novo_titulo = artigo.titulo
    novo_resumo = artigo.resumo
    novo_conteudo = artigo.conteudo

    if "titulo" in campos:
        titulo = campos["titulo"]

        if titulo is None:
            raise ArtigoInvalidoError("O título do artigo não pode ser nulo.")

        novo_titulo = _normalizar_titulo(titulo)

    if "resumo" in campos:
        novo_resumo = campos["resumo"]

    if "conteudo" in campos:
        novo_conteudo = campos["conteudo"]

    if artigo.status == "publicado":
        campos_ausentes = _campos_ausentes_para_publicacao(
            titulo=novo_titulo,
            resumo=novo_resumo,
            conteudo=novo_conteudo,
        )

        if campos_ausentes:
            raise ArtigoPublicacaoError(
                "Um artigo publicado deve manter preenchidos: "
                + ", ".join(campos_ausentes)
                + "."
            )

    artigo.titulo = novo_titulo
    artigo.resumo = novo_resumo
    artigo.conteudo = novo_conteudo

    return _commit_refresh(db=db, artigo=artigo)


def publicar_artigo(db: Session, artigo_id: int) -> Artigo:
    """Publica um artigo completo, preservando a primeira publicação."""

    artigo = _buscar_artigo_ou_falhar(db=db, artigo_id=artigo_id)
    campos_ausentes = _campos_ausentes_para_publicacao(
        titulo=artigo.titulo,
        resumo=artigo.resumo,
        conteudo=artigo.conteudo,
    )

    if campos_ausentes:
        raise ArtigoPublicacaoError(
            "Preencha os seguintes campos antes de publicar: "
            + ", ".join(campos_ausentes)
            + "."
        )

    artigo.status = "publicado"

    if artigo.publicado_em is None:
        artigo.publicado_em = agora_utc()

    return _commit_refresh(db=db, artigo=artigo)


def despublicar_artigo(db: Session, artigo_id: int) -> Artigo:
    """Retorna o artigo a rascunho sem apagar a primeira publicação."""

    artigo = _buscar_artigo_ou_falhar(db=db, artigo_id=artigo_id)
    artigo.status = "rascunho"

    return _commit_refresh(db=db, artigo=artigo)


def excluir_artigo(db: Session, artigo_id: int) -> Artigo:
    """Realiza exclusão lógica e preserva o registro para auditoria."""

    artigo = _buscar_artigo_ou_falhar(db=db, artigo_id=artigo_id)
    artigo.excluido_em = agora_utc()

    return _commit_refresh(db=db, artigo=artigo)
