from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArquivoCasoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caso_id: int
    nome_original: str
    content_type: str
    tamanho_bytes: int
    enviado_por_id: int
    criado_em: datetime


class ArquivoLinkResponse(BaseModel):
    url: str
    expira_em_segundos: int