from io import BytesIO

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.services.cliente_service import buscar_cliente
from app.services.storage_service import (
    EXPIRA_EM_SEGUNDOS,
    FalhaStorageError,
    enviar_arquivo,
    gerar_chave_foto_cliente,
    gerar_url_download,
    remover_arquivo_storage,
)

TAMANHO_MAXIMO_MB = 5
TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024
FORMATOS_ACEITOS = {"JPEG", "PNG", "WEBP"}
LADO_MAXIMO = 720


class FotoClienteInvalidaError(ValueError):
    pass


class ClienteFotoNaoEncontradoError(Exception):
    pass


def processar_foto_cliente(conteudo: bytes) -> bytes:
    try:
        with Image.open(BytesIO(conteudo)) as original:
            if original.format not in FORMATOS_ACEITOS:
                raise FotoClienteInvalidaError(
                    "Formato não aceito. Envie uma foto JPG, PNG ou WEBP."
                )

            original.load()
            imagem = ImageOps.exif_transpose(original)
            transparente = "A" in imagem.getbands() or (
                imagem.mode == "P" and "transparency" in imagem.info
            )
            imagem = imagem.convert("RGBA" if transparente else "RGB")
            imagem.thumbnail((LADO_MAXIMO, LADO_MAXIMO))

            saida = BytesIO()
            imagem.save(saida, "WEBP", quality=82, method=4)
            return saida.getvalue()
    except FotoClienteInvalidaError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as erro:
        raise FotoClienteInvalidaError(
            "O arquivo enviado não é uma foto válida (JPG, PNG ou WEBP)."
        ) from erro


def salvar_foto_cliente(db: Session, cliente_id: int, arquivo: UploadFile) -> Cliente:
    cliente = buscar_cliente(db=db, cliente_id=cliente_id)
    if cliente is None:
        raise ClienteFotoNaoEncontradoError("Cliente não encontrado.")

    conteudo = arquivo.file.read(TAMANHO_MAXIMO_BYTES + 1)
    if not conteudo:
        raise FotoClienteInvalidaError("A foto está vazia.")
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise FotoClienteInvalidaError(
            f"A foto excede o limite de {TAMANHO_MAXIMO_MB} MB."
        )

    processada = processar_foto_cliente(conteudo)
    chave_nova = gerar_chave_foto_cliente(cliente_id)
    chave_anterior = cliente.foto_chave_storage

    enviar_arquivo(BytesIO(processada), chave_nova, "image/webp")
    cliente.foto_chave_storage = chave_nova
    try:
        db.commit()
    except Exception:
        db.rollback()
        try:
            remover_arquivo_storage(chave_nova)
        except FalhaStorageError:
            pass
        raise

    db.refresh(cliente)
    if chave_anterior:
        try:
            remover_arquivo_storage(chave_anterior)
        except FalhaStorageError:
            pass

    return cliente


def gerar_link_foto_cliente(db: Session, cliente_id: int) -> dict:
    cliente = buscar_cliente(db=db, cliente_id=cliente_id, incluir_inativos=True)
    if cliente is None or not cliente.foto_chave_storage:
        raise ClienteFotoNaoEncontradoError("Foto do cliente não encontrada.")

    url = gerar_url_download(
        chave=cliente.foto_chave_storage,
        nome_original=f"foto-cliente-{cliente_id}.webp",
        inline=True,
    )
    return {"url": url, "expira_em_segundos": EXPIRA_EM_SEGUNDOS}


def remover_foto_cliente(db: Session, cliente_id: int) -> Cliente:
    cliente = buscar_cliente(db=db, cliente_id=cliente_id)
    if cliente is None:
        raise ClienteFotoNaoEncontradoError("Cliente não encontrado.")

    chave = cliente.foto_chave_storage
    cliente.foto_chave_storage = None
    db.commit()
    db.refresh(cliente)

    if chave:
        try:
            remover_arquivo_storage(chave)
        except FalhaStorageError:
            pass

    return cliente
