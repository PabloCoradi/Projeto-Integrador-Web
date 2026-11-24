from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ResumoClientes(BaseModel):
    ativos: int
    novos_no_periodo: int
    sem_casos_ativos: int
    documentos: int


class TotalPorTipo(BaseModel):
    tipo: str
    total: int


class ResumoCasos(BaseModel):
    ativos: int
    novos_no_periodo: int
    arquivos: int
    por_tipo: list[TotalPorTipo]


class ResumoArtigos(BaseModel):
    publicados: int
    rascunhos: int


class Atividade(BaseModel):
    tipo: Literal["cliente", "documento", "caso", "arquivo", "artigo"]
    titulo: str
    descricao: str
    data: datetime


class DashboardResponse(BaseModel):
    """Blocos vêm como null quando o usuário não vê aquele módulo."""

    periodo_dias: int
    clientes: ResumoClientes | None
    casos: ResumoCasos | None
    artigos: ResumoArtigos | None
    atividades: list[Atividade]
