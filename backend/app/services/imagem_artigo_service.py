from io import BytesIO
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.artigo import Artigo
from app.models.imagem_artigo import ImagemArtigo
from app.services.storage_service import enviar_arquivo, gerar_chave_imagem_artigo

FORMATOS_ACEITOS = {"JPEG", "PNG", "WEBP"}
TAMANHO_MAXIMO_MB = 10
TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024

# Maior lado da imagem salva: suficiente para a capa no site e bem mais leve
LADO_MAXIMO = 1600
QUALIDADE_WEBP = 82

# Recusa imagens absurdamente grandes (proteção contra "bombas" de descompressão)
Image.MAX_IMAGE_PIXELS = 40_000_000


class ImagemInvalidaError(ValueError):
    pass


class ImagemEmUsoError(Exception):
    pass


def processar_imagem(conteudo: bytes) -> tuple[bytes, int, int]:
    """Valida e converte a imagem para WEBP; retorna (bytes, largura, altura).

    A conversão também descarta os metadados da foto (como a localização GPS
    que celulares gravam) e corrige fotos tiradas com o celular "deitado".
    """

    try:
        with Image.open(BytesIO(conteudo)) as original:
            if original.format not in FORMATOS_ACEITOS:
                raise ImagemInvalidaError(
                    "Formato não aceito. Envie uma imagem JPG, PNG ou WEBP."
                )

            original.load()
            imagem = ImageOps.exif_transpose(original)

            tem_transparencia = "A" in imagem.getbands() or (
                imagem.mode == "P" and "transparency" in imagem.info
            )
            imagem = imagem.convert("RGBA" if tem_transparencia else "RGB")
            imagem.thumbnail((LADO_MAXIMO, LADO_MAXIMO))

            saida = BytesIO()
            imagem.save(saida, "WEBP", quality=QUALIDADE_WEBP, method=4)

            return saida.getvalue(), imagem.width, imagem.height
    except ImagemInvalidaError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as erro:
        raise ImagemInvalidaError(
            "O arquivo enviado não é uma imagem válida (JPG, PNG ou WEBP)."
        ) from erro


def enviar_imagem(
    db: Session,
    usuario_id: int,
    arquivo: UploadFile,
) -> ImagemArtigo:
    nome = Path(arquivo.filename or "").name.strip()[:255] or "imagem"

    conteudo = arquivo.file.read(TAMANHO_MAXIMO_BYTES + 1)

    if not conteudo:
        raise ImagemInvalidaError("O arquivo está vazio.")

    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise ImagemInvalidaError(
            f"A imagem excede o limite de {TAMANHO_MAXIMO_MB} MB."
        )

    dados, largura, altura = processar_imagem(conteudo)
    chave = gerar_chave_imagem_artigo()

    enviar_arquivo(BytesIO(dados), chave, "image/webp")

    imagem = ImagemArtigo(
        enviado_por_id=usuario_id,
        nome_original=nome,
        chave_storage=chave,
        content_type="image/webp",
        tamanho_bytes=len(dados),
        largura=largura,
        altura=altura,
    )

    db.add(imagem)
    db.commit()
    db.refresh(imagem)

    return imagem


def listar_imagens(db: Session) -> list[ImagemArtigo]:
    return list(
        db.scalars(
            select(ImagemArtigo)
            .where(ImagemArtigo.ativo.is_(True))
            .order_by(ImagemArtigo.criado_em.desc(), ImagemArtigo.id.desc())
        ).all()
    )


def buscar_imagem(db: Session, imagem_id: int) -> ImagemArtigo | None:
    return db.scalar(
        select(ImagemArtigo).where(
            ImagemArtigo.id == imagem_id,
            ImagemArtigo.ativo.is_(True),
        )
    )


def inativar_imagem(db: Session, imagem_id: int) -> ImagemArtigo | None:
    """Remove a imagem da galeria, desde que nenhum artigo a esteja usando."""

    imagem = buscar_imagem(db=db, imagem_id=imagem_id)

    if imagem is None:
        return None

    em_uso = db.scalar(
        select(func.count())
        .select_from(Artigo)
        .where(
            Artigo.imagem_id == imagem_id,
            Artigo.excluido_em.is_(None),
        )
    ) or 0

    if em_uso:
        raise ImagemEmUsoError(
            f"Esta imagem é a capa de {em_uso} artigo(s). "
            "Troque a capa desses artigos antes de removê-la."
        )

    imagem.ativo = False
    db.commit()
    db.refresh(imagem)

    return imagem
