from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class ClienteCreate(BaseModel):
    nome: str = Field(
        min_length=2,
        max_length=150,
    )

    cpf_cnpj: str | None = Field(
        default=None,
        max_length=20,
    )

    email: EmailStr | None = None

    telefone: str | None = Field(
        default=None,
        max_length=30,
    )

    endereco: str | None = Field(
        default=None,
        max_length=255,
    )

    observacoes: str | None = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError("O nome do cliente é obrigatório.")

        return valor


class ClienteUpdate(BaseModel):
    nome: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    cpf_cnpj: str | None = Field(
        default=None,
        max_length=20,
    )

    email: EmailStr | None = None

    telefone: str | None = Field(
        default=None,
        max_length=30,
    )

    endereco: str | None = Field(
        default=None,
        max_length=255,
    )

    observacoes: str | None = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if not valor:
            raise ValueError(
                "O nome do cliente não pode ficar vazio."
            )

        return valor


class ClienteResponse(BaseModel):
    id: int
    nome: str
    cpf_cnpj: str | None
    email: EmailStr | None
    telefone: str | None
    endereco: str | None
    observacoes: str | None
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = {
        "from_attributes": True
    }