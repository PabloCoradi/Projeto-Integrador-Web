"""
Resumo exibido no Dashboard do painel.

Cada bloco só é montado se o usuário puder visualizar o módulo
correspondente: quem só vê "artigos", por exemplo, não recebe números
nem nomes de clientes e casos.
"""

from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc
from app.core.texto import normalizar_busca
from app.models.arquivo_caso import ArquivoCaso
from app.models.artigo import Artigo
from app.models.caso import Caso
from app.models.cliente import Cliente
from app.models.documento_cliente import DocumentoCliente
from app.models.permissao import Permissao
from app.models.usuario import Usuario
from app.services.caso_service import caso_em_andamento

DIAS_RECENTES = 30
LIMITE_ATIVIDADES = 8
LIMITE_TIPOS = 6


def modulos_visiveis(db: Session, usuario: Usuario) -> set[str]:
    """Módulos que o usuário pode ao menos visualizar."""

    if usuario.is_admin:
        return {"clientes", "casos", "artigos"}

    permissoes = db.scalars(
        select(Permissao).where(Permissao.usuario_id == usuario.id)
    ).all()

    return {
        p.modulo for p in permissoes if p.pode_visualizar or p.pode_editar
    }


def _contar(db: Session, consulta) -> int:
    return db.scalar(consulta) or 0


def _resumo_clientes(db: Session, desde: datetime) -> dict:
    ativo = Cliente.ativo.is_(True)

    casos_ativos_do_cliente = (
        select(Caso.id)
        .where(Caso.cliente_id == Cliente.id, Caso.ativo.is_(True))
        .exists()
    )

    return {
        "ativos": _contar(db, select(func.count(Cliente.id)).where(ativo)),
        "novos_no_periodo": _contar(
            db,
            select(func.count(Cliente.id)).where(ativo, Cliente.criado_em >= desde),
        ),
        "sem_casos_ativos": _contar(
            db,
            select(func.count(Cliente.id)).where(ativo, ~casos_ativos_do_cliente),
        ),
        "documentos": _contar(
            db,
            select(func.count(DocumentoCliente.id))
            .join(Cliente, Cliente.id == DocumentoCliente.cliente_id)
            .where(DocumentoCliente.ativo.is_(True), ativo),
        ),
    }


def _agrupar_tipos(nomes: list[str]) -> list[dict]:
    """Junta grafias diferentes do mesmo tipo ("Cível", "civel", "CÍVEL ").

    Cada grupo aparece com a grafia mais usada.
    """

    grupos: dict[str, Counter] = {}
    for nome in nomes:
        grupos.setdefault(normalizar_busca(nome), Counter())[nome.strip()] += 1

    tipos = [
        {"tipo": grafias.most_common(1)[0][0], "total": sum(grafias.values())}
        for grafias in grupos.values()
    ]

    return sorted(tipos, key=lambda item: (-item["total"], normalizar_busca(item["tipo"])))


def _resumo_casos(db: Session, desde: datetime) -> dict:
    # Caso de cliente inativo não conta como caso em andamento.
    ativo = caso_em_andamento()

    tipos = _agrupar_tipos(
        list(db.scalars(select(Caso.tipo_atendimento).where(ativo)).all())
    )

    # Os tipos menos frequentes viram um único "Outros" para o gráfico
    # não ficar comprido demais.
    if len(tipos) > LIMITE_TIPOS:
        restantes = sum(item["total"] for item in tipos[LIMITE_TIPOS - 1 :])
        tipos = tipos[: LIMITE_TIPOS - 1] + [{"tipo": "Outros", "total": restantes}]

    return {
        "ativos": _contar(db, select(func.count(Caso.id)).where(ativo)),
        "novos_no_periodo": _contar(
            db,
            select(func.count(Caso.id)).where(ativo, Caso.criado_em >= desde),
        ),
        "arquivos": _contar(
            db,
            select(func.count(ArquivoCaso.id))
            .join(Caso, Caso.id == ArquivoCaso.caso_id)
            .where(ArquivoCaso.ativo.is_(True), ativo),
        ),
        "por_tipo": tipos,
    }


def _resumo_artigos(db: Session) -> dict:
    nao_excluido = Artigo.excluido_em.is_(None)

    def contar_status(status: str) -> int:
        return _contar(
            db,
            select(func.count(Artigo.id)).where(nao_excluido, Artigo.status == status),
        )

    return {
        "publicados": contar_status("publicado"),
        "rascunhos": contar_status("rascunho"),
    }


def _atividades(db: Session, modulos: set[str]) -> list[dict]:
    """Últimos acontecimentos, misturando os módulos que o usuário vê."""

    limite = LIMITE_ATIVIDADES
    eventos: list[dict] = []

    if "clientes" in modulos:
        for cliente in db.scalars(
            select(Cliente)
            .where(Cliente.ativo.is_(True))
            .order_by(Cliente.criado_em.desc())
            .limit(limite)
        ):
            eventos.append({
                "tipo": "cliente",
                "titulo": cliente.nome,
                "descricao": "Novo cliente cadastrado",
                "data": cliente.criado_em,
            })

        for documento, nome_cliente in db.execute(
            select(DocumentoCliente, Cliente.nome)
            .join(Cliente, Cliente.id == DocumentoCliente.cliente_id)
            .where(DocumentoCliente.ativo.is_(True), Cliente.ativo.is_(True))
            .order_by(DocumentoCliente.criado_em.desc())
            .limit(limite)
        ):
            eventos.append({
                "tipo": "documento",
                "titulo": documento.nome_original,
                "descricao": f"Documento de {nome_cliente}",
                "data": documento.criado_em,
            })

    if "casos" in modulos:
        for caso, nome_cliente in db.execute(
            select(Caso, Cliente.nome)
            .join(Cliente, Cliente.id == Caso.cliente_id)
            .where(Caso.ativo.is_(True), Cliente.ativo.is_(True))
            .order_by(Caso.criado_em.desc())
            .limit(limite)
        ):
            eventos.append({
                "tipo": "caso",
                "titulo": caso.titulo,
                "descricao": f"Novo caso de {nome_cliente}",
                "data": caso.criado_em,
            })

        for arquivo, titulo_caso in db.execute(
            select(ArquivoCaso, Caso.titulo)
            .join(Caso, Caso.id == ArquivoCaso.caso_id)
            .where(ArquivoCaso.ativo.is_(True), caso_em_andamento())
            .order_by(ArquivoCaso.criado_em.desc())
            .limit(limite)
        ):
            eventos.append({
                "tipo": "arquivo",
                "titulo": arquivo.nome_original,
                "descricao": f"Arquivo anexado em {titulo_caso}",
                "data": arquivo.criado_em,
            })

    if "artigos" in modulos:
        data_artigo = func.coalesce(Artigo.publicado_em, Artigo.criado_em)
        for artigo in db.scalars(
            select(Artigo)
            .where(Artigo.excluido_em.is_(None))
            .order_by(data_artigo.desc())
            .limit(limite)
        ):
            publicado = artigo.status == "publicado" and artigo.publicado_em
            eventos.append({
                "tipo": "artigo",
                "titulo": artigo.titulo,
                "descricao": "Artigo publicado no site" if publicado else "Rascunho criado",
                "data": artigo.publicado_em if publicado else artigo.criado_em,
            })

    eventos.sort(key=lambda evento: evento["data"], reverse=True)
    return eventos[:limite]


def montar_resumo(db: Session, usuario: Usuario) -> dict:
    modulos = modulos_visiveis(db, usuario)
    desde = agora_utc() - timedelta(days=DIAS_RECENTES)

    return {
        "periodo_dias": DIAS_RECENTES,
        "clientes": _resumo_clientes(db, desde) if "clientes" in modulos else None,
        "casos": _resumo_casos(db, desde) if "casos" in modulos else None,
        "artigos": _resumo_artigos(db) if "artigos" in modulos else None,
        "atividades": _atividades(db, modulos),
    }
