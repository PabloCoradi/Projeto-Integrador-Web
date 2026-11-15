from datetime import datetime
from typing import Literal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


ArtigoStatus = Literal["rascunho", "publicado"]


def _normalizar_texto_opcional(valor: object) -> object:
    if isinstance(valor, str):
        return valor.strip() or None

    return valor


class _CamposDeCapa(BaseModel):
    """Capa do artigo: imagem enviada (imagem_id) OU imagem padrão (imagem_padrao).

    Deixar as duas vazias faz o site usar a imagem padrão geral.
    """

    imagem_id: int | None = Field(default=None, ge=1)
    imagem_padrao: str | None = Field(default=None, max_length=50)
    imagem_alt: str | None = Field(default=None, max_length=255)

    @field_validator("imagem_padrao", "imagem_alt", mode="before")
    @classmethod
    def normalizar_textos_da_capa(cls, valor: object) -> object:
        return _normalizar_texto_opcional(valor)

    @model_validator(mode="after")
    def validar_uma_capa(self):
        if self.imagem_id is not None and self.imagem_padrao is not None:
            raise ValueError(
                "Escolha apenas uma imagem de capa: enviada ou padrão."
            )

        return self


class ArtigoCreate(_CamposDeCapa):
    """Dados aceitos ao criar um artigo como rascunho."""

    model_config = ConfigDict(extra="forbid")

    titulo: str = Field(
        min_length=2,
        max_length=250,
    )
    resumo: str | None = None
    conteudo: str | None = None

    @field_validator("titulo", mode="before")
    @classmethod
    def normalizar_titulo(cls, valor: object) -> object:
        if isinstance(valor, str):
            return valor.strip()

        return valor


class ArtigoUpdate(_CamposDeCapa):
    """Campos editoriais que podem ser alterados diretamente."""

    model_config = ConfigDict(extra="forbid")

    titulo: str | None = Field(
        default=None,
        min_length=2,
        max_length=250,
    )
    resumo: str | None = None
    conteudo: str | None = None

    @model_validator(mode="before")
    @classmethod
    def validar_campos_enviados(cls, dados: object) -> object:
        if isinstance(dados, dict):
            if not dados:
                raise ValueError(
                    "Informe ao menos um campo para atualizar o artigo."
                )

            if "titulo" in dados and dados["titulo"] is None:
                raise ValueError("O título do artigo não pode ser nulo.")

        return dados

    @field_validator("titulo", mode="before")
    @classmethod
    def normalizar_titulo(cls, valor: object) -> object:
        if isinstance(valor, str):
            return valor.strip()

        return valor


class ArtigoAdminResponse(BaseModel):
    """Representação completa utilizada no painel autenticado."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    autor_id: int
    titulo: str
    slug: str
    resumo: str | None
    conteudo: str | None
    imagem_id: int | None
    imagem_padrao: str | None
    imagem_alt: str | None
    imagem_url: str
    status: ArtigoStatus
    publicado_em: datetime | None
    excluido_em: datetime | None
    criado_em: datetime
    atualizado_em: datetime


class ArtigoAdminListItem(BaseModel):
    """Representação enxuta usada na tabela do painel."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    slug: str
    status: ArtigoStatus
    publicado_em: datetime | None
    atualizado_em: datetime


class ArtigoPublicResponse(BaseModel):
    """Campos seguros necessários para exibir uma publicação no site."""

    model_config = ConfigDict(from_attributes=True)

    titulo: str
    slug: str
    resumo: str
    conteudo: str
    imagem_url: str
    imagem_alt: str = Field(
        validation_alias=AliasChoices("imagem_alt_publico", "imagem_alt"),
    )
    publicado_em: datetime


class ArtigoPublicListItem(BaseModel):
    """Resumo público; o corpo completo é retornado somente por slug."""

    model_config = ConfigDict(from_attributes=True)

    titulo: str
    slug: str
    resumo: str
    imagem_url: str
    imagem_alt: str = Field(
        validation_alias=AliasChoices("imagem_alt_publico", "imagem_alt"),
    )
    publicado_em: datetime


class PaginacaoResponse(BaseModel):
    page: int = Field(ge=1)
    por_pagina: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    total_paginas: int = Field(ge=0)


class ArtigoAdminPageResponse(PaginacaoResponse):
    items: list[ArtigoAdminListItem]


class ArtigoPublicPageResponse(PaginacaoResponse):
    items: list[ArtigoPublicListItem]
