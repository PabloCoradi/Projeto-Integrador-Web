import uuid
from urllib.parse import quote

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

# Tempo de validade do link de download
EXPIRA_EM_SEGUNDOS = 300


class FalhaStorageError(Exception):
    """Erro ao conversar com o RustFS."""

_cliente = boto3.client(
    "s3",
    endpoint_url=settings.RUSTFS_ENDPOINT,
    aws_access_key_id=settings.RUSTFS_ACCESS_KEY,
    aws_secret_access_key=settings.RUSTFS_SECRET_KEY,
    region_name="us-east-1",
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "path"},
    ),
)


def gerar_chave(caso_id: int) -> str:

    return f"casos/{caso_id}/{uuid.uuid4().hex}"


def enviar_arquivo(arquivo, chave: str, content_type: str) -> None:

    try:
        _cliente.upload_fileobj(
            arquivo,
            settings.RUSTFS_BUCKET,
            chave,
            ExtraArgs={"ContentType": content_type},
        )
    except (BotoCoreError, ClientError) as erro:
        raise FalhaStorageError(
            "Não foi possível salvar o arquivo no armazenamento."
        ) from erro


def gerar_url_download(
    chave: str,
    nome_original: str,
    inline: bool = False,
) -> str:

    tipo = "inline" if inline else "attachment"
    disposicao = f"{tipo}; filename*=UTF-8''{quote(nome_original, safe='')}"

    try:
        return _cliente.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.RUSTFS_BUCKET,
                "Key": chave,
                "ResponseContentDisposition": disposicao,
            },
            ExpiresIn=EXPIRA_EM_SEGUNDOS,
        )
    except (BotoCoreError, ClientError) as erro:
        raise FalhaStorageError(
            "Não foi possível gerar o link do arquivo."
        ) from erro
