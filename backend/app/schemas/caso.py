from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CasoCreate(BaseModel):
    cliente_id: int

    titulo: str = Field(
        min_length=2,
        max_length=200,
    )

    tipo_atendimento: str = Field(
        min_length=2,
        max_length=100,
    )

    observacoes: str | None = None

    @field_validator("titulo")
    @classmethod
    def validar_titulo(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError("O título do caso é obrigatório.")

        return valor

    @field_validator("tipo_atendimento")
    @classmethod
    def validar_tipo_atendimento(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError("O tipo de atendimento é obrigatório.")

        return valor


class CasoUpdate(BaseModel):
    titulo: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    tipo_atendimento: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    observacoes: str | None = None

    @field_validator("titulo")
    @classmethod
    def validar_titulo(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if not valor:
            raise ValueError("O título do caso não pode ficar vazio.")

        return valor

    @field_validator("tipo_atendimento")
    @classmethod
    def validar_tipo_atendimento(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if not valor:
            raise ValueError(
                "O tipo de atendimento não pode ficar vazio."
            )

        return valor


class CasoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int
    titulo: str
    tipo_atendimento: str
    observacoes: str | None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
