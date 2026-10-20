from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.arquivo_caso import ArquivoCaso
from app.services.caso_service import buscar_caso
from app.services.storage_service import (
    EXPIRA_EM_SEGUNDOS,
    enviar_arquivo,
    gerar_chave,
    gerar_url_download,
)

TAMANHO_MAXIMO_MB = 500
TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024


class CasoNaoEncontradoError(Exception):
    pass


class ArquivoInvalidoError(ValueError):
    pass


def anexar_arquivo(
    db: Session,
    caso_id: int,
    usuario_id: int,
    arquivo: UploadFile,
) -> ArquivoCaso:
    caso = buscar_caso(db=db, caso_id=caso_id)

    if caso is None:
        raise CasoNaoEncontradoError("Caso não encontrado.")

    nome = Path(arquivo.filename or "").name.strip()

    if not nome:
        raise ArquivoInvalidoError("O arquivo precisa ter um nome.")

    nome = nome[:255]

    arquivo.file.seek(0, 2)
    tamanho = arquivo.file.tell()
    arquivo.file.seek(0)

    if tamanho == 0:
        raise ArquivoInvalidoError("O arquivo está vazio.")

    if tamanho > TAMANHO_MAXIMO_BYTES:
        raise ArquivoInvalidoError(
            f"O arquivo excede o limite de {TAMANHO_MAXIMO_MB} MB."
        )

    content_type = arquivo.content_type or "application/octet-stream"
    chave = gerar_chave(caso_id)

    enviar_arquivo(arquivo.file, chave, content_type)

    registro = ArquivoCaso(
        caso_id=caso_id,
        enviado_por_id=usuario_id,
        nome_original=nome,
        chave_storage=chave,
        content_type=content_type,
        tamanho_bytes=tamanho,
    )

    db.add(registro)
    db.commit()
    db.refresh(registro)

    return registro


def listar_arquivos(db: Session, caso_id: int) -> list[ArquivoCaso]:
    consulta = (
        select(ArquivoCaso)
        .where(
            ArquivoCaso.caso_id == caso_id,
            ArquivoCaso.ativo.is_(True),
        )
        .order_by(ArquivoCaso.criado_em.desc())
    )

    return list(db.scalars(consulta).all())


def buscar_arquivo(
    db: Session,
    caso_id: int,
    arquivo_id: int,
) -> ArquivoCaso | None:
    return db.scalar(
        select(ArquivoCaso).where(
            ArquivoCaso.id == arquivo_id,
            ArquivoCaso.caso_id == caso_id,
            ArquivoCaso.ativo.is_(True),
        )
    )


def gerar_link(arquivo: ArquivoCaso, inline: bool = False) -> dict:
    url = gerar_url_download(
        chave=arquivo.chave_storage,
        nome_original=arquivo.nome_original,
        inline=inline,
    )

    return {
        "url": url,
        "expira_em_segundos": EXPIRA_EM_SEGUNDOS,
    }


def inativar_arquivo(
    db: Session,
    caso_id: int,
    arquivo_id: int,
) -> ArquivoCaso | None:
    arquivo = buscar_arquivo(db=db, caso_id=caso_id, arquivo_id=arquivo_id)

    if arquivo is None:
        return None

    arquivo.ativo = False
    db.commit()
    db.refresh(arquivo)

    return arquivo
