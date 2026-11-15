from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.arquivo_service import normalizar_tag


class DocumentoClienteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int
    tag: str
    nome_original: str
    content_type: str
    tamanho_bytes: int
    enviado_por_id: int
    criado_em: datetime


class DocumentoClienteUpdate(BaseModel):
    tag: str = Field(min_length=1, max_length=50)

    @field_validator("tag")
    @classmethod
    def validar_tag(cls, valor: str) -> str:
        return normalizar_tag(valor)
