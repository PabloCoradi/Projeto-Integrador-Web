from io import BytesIO

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.models.caso import Caso
from app.services.caso_service import buscar_caso
from app.services.storage_service import (
    EXPIRA_EM_SEGUNDOS,
    FalhaStorageError,
    enviar_arquivo,
    gerar_chave_foto_caso,
    gerar_url_download,
    remover_arquivo_storage,
)

TAMANHO_MAXIMO_MB = 5
TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024
FORMATOS_ACEITOS = {"JPEG", "PNG", "WEBP"}
LADO_MAXIMO = 720
Image.MAX_IMAGE_PIXELS = 20_000_000


class FotoCasoInvalidaError(ValueError):
    pass


class CasoFotoNaoEncontradoError(Exception):
    pass


def processar_foto(conteudo: bytes) -> bytes:
    try:
        with Image.open(BytesIO(conteudo)) as original:
            if original.format not in FORMATOS_ACEITOS:
                raise FotoCasoInvalidaError(
                    "Formato não aceito. Envie uma foto JPG, PNG ou WEBP."
                )

            original.load()
            imagem = ImageOps.exif_transpose(original)
            tem_transparencia = "A" in imagem.getbands() or (
                imagem.mode == "P" and "transparency" in imagem.info
            )
            imagem = imagem.convert("RGBA" if tem_transparencia else "RGB")
            imagem.thumbnail((LADO_MAXIMO, LADO_MAXIMO))

            saida = BytesIO()
            imagem.save(saida, "WEBP", quality=82, method=4)
            return saida.getvalue()
    except FotoCasoInvalidaError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as erro:
        raise FotoCasoInvalidaError(
            "O arquivo enviado não é uma foto válida (JPG, PNG ou WEBP)."
        ) from erro


def salvar_foto_caso(db: Session, caso_id: int, arquivo: UploadFile) -> Caso:
    caso = buscar_caso(db=db, caso_id=caso_id)
    if caso is None:
        raise CasoFotoNaoEncontradoError("Caso não encontrado.")

    conteudo = arquivo.file.read(TAMANHO_MAXIMO_BYTES + 1)
    if not conteudo:
        raise FotoCasoInvalidaError("A foto está vazia.")
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise FotoCasoInvalidaError(
            f"A foto excede o limite de {TAMANHO_MAXIMO_MB} MB."
        )

    processada = processar_foto(conteudo)
    chave_nova = gerar_chave_foto_caso(caso_id)
    chave_anterior = caso.foto_chave_storage

    enviar_arquivo(BytesIO(processada), chave_nova, "image/webp")
    caso.foto_chave_storage = chave_nova
    try:
        db.commit()
    except Exception:
        db.rollback()
        try:
            remover_arquivo_storage(chave_nova)
        except FalhaStorageError:
            pass
        raise

    db.refresh(caso)
    if chave_anterior:
        try:
            remover_arquivo_storage(chave_anterior)
        except FalhaStorageError:
            # A foto nova já está salva; uma falha de limpeza não desfaz a troca.
            pass

    return caso


def gerar_link_foto_caso(db: Session, caso_id: int) -> dict:
    caso = buscar_caso(db=db, caso_id=caso_id)
    if caso is None or not caso.foto_chave_storage:
        raise CasoFotoNaoEncontradoError("Foto do caso não encontrada.")

    url = gerar_url_download(
        chave=caso.foto_chave_storage,
        nome_original=f"foto-caso-{caso_id}.webp",
        inline=True,
    )
    return {"url": url, "expira_em_segundos": EXPIRA_EM_SEGUNDOS}


def remover_foto_caso(db: Session, caso_id: int) -> Caso:
    caso = buscar_caso(db=db, caso_id=caso_id)
    if caso is None:
        raise CasoFotoNaoEncontradoError("Caso não encontrado.")

    chave = caso.foto_chave_storage
    caso.foto_chave_storage = None
    db.commit()
    db.refresh(caso)

    if chave:
        try:
            remover_arquivo_storage(chave)
        except FalhaStorageError:
            # O registro já não aponta para a foto; a remoção visual foi concluída.
            pass

    return caso
