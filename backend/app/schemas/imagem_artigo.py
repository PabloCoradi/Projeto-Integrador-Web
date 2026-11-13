from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImagemArtigoResponse(BaseModel):
    """Imagem da galeria; a url é relativa ao endereço da API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nome_original: str
    largura: int
    altura: int
    tamanho_bytes: int
    criado_em: datetime
    url: str


class ImagemPadraoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chave: str
    titulo: str
    texto_alternativo: str
    url: str
