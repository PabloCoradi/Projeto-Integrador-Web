from sqlalchemy import and_, not_, select
from sqlalchemy.orm import Session, selectinload

from app.core.texto import normalizar_busca
from app.models.caso import Caso
from app.models.cliente import Cliente


class ClienteNaoEncontradoError(Exception):
    pass


class ClienteInativoError(Exception):
    pass


class SituacaoInvalidaError(Exception):
    """Pedido de inativar o que já está inativo (ou reativar o que já está ativo)."""


def caso_em_andamento():
    """Condição SQL: o caso e o cliente dele estão ativos."""

    cliente_ativo = (
        select(Cliente.id)
        .where(Cliente.id == Caso.cliente_id, Cliente.ativo.is_(True))
        .exists()
    )

    return and_(Caso.ativo.is_(True), cliente_ativo)


def criar_caso(
    db: Session,
    cliente_id: int,
    titulo: str,
    tipo_atendimento: str,
    observacoes: str | None = None,
) -> Caso:
    cliente = db.scalar(
        select(Cliente).where(
            Cliente.id == cliente_id,
            Cliente.ativo.is_(True),
        )
    )

    if cliente is None:
        raise ClienteNaoEncontradoError("Cliente não encontrado.")

    caso = Caso(
        cliente_id=cliente_id,
        titulo=titulo,
        tipo_atendimento=tipo_atendimento,
        observacoes=observacoes,
    )

    db.add(caso)
    db.commit()
    db.refresh(caso)

    return caso


def listar_casos(
    db: Session,
    cliente_id: int | None = None,
    tipo_atendimento: str | None = None,
    q: str | None = None,
    inativos: bool = False,
) -> list[Caso]:
    """Lista os casos em andamento, ou os inativos quando inativos=True.

    Casos de cliente inativo contam como inativos. Os filtros de tipo e de
    texto ignoram acentos e maiúsculas ("civel" encontra "Cível"). A busca
    por texto procura no nome do cliente, no título, no tipo de atendimento
    e nas observações do caso.
    """

    em_andamento = caso_em_andamento()

    consulta = (
        select(Caso)
        .options(selectinload(Caso.cliente))
        .where(not_(em_andamento) if inativos else em_andamento)
    )

    if cliente_id is not None:
        consulta = consulta.where(Caso.cliente_id == cliente_id)

    consulta = consulta.order_by(Caso.criado_em.desc())
    casos = list(db.scalars(consulta).all())

    tipo = normalizar_busca(tipo_atendimento)
    if tipo:
        casos = [c for c in casos if tipo in normalizar_busca(c.tipo_atendimento)]

    termo = normalizar_busca(q)
    if termo:
        casos = [
            c for c in casos
            if termo in normalizar_busca(c.cliente.nome)
            or termo in normalizar_busca(c.titulo)
            or termo in normalizar_busca(c.tipo_atendimento)
            or termo in normalizar_busca(c.observacoes)
        ]

    return casos


def buscar_caso(
    db: Session,
    caso_id: int,
    incluir_inativos: bool = False,
) -> Caso | None:
    """Busca um caso em andamento; incluir_inativos=True serve só para consultas."""

    consulta = select(Caso).where(Caso.id == caso_id)

    if not incluir_inativos:
        consulta = consulta.where(caso_em_andamento())

    return db.scalar(consulta)


def atualizar_caso(db: Session, caso_id: int, campos: dict) -> Caso | None:
    caso = buscar_caso(db=db, caso_id=caso_id)

    if caso is None:
        return None

    for nome, valor in campos.items():
        if valor is None and nome in ("titulo", "tipo_atendimento"):
            continue

        setattr(caso, nome, valor)

    db.commit()
    db.refresh(caso)

    return caso


def inativar_caso(db: Session, caso_id: int) -> Caso | None:
    caso = buscar_caso(db=db, caso_id=caso_id, incluir_inativos=True)

    if caso is None:
        return None

    if not caso.ativo:
        raise SituacaoInvalidaError("Este caso já está inativo.")

    caso.ativo = False
    db.commit()
    db.refresh(caso)

    return caso


def reativar_caso(db: Session, caso_id: int) -> Caso | None:
    caso = db.get(Caso, caso_id)

    if caso is None:
        return None

    if not caso.cliente.ativo:
        raise ClienteInativoError(
            "O cliente deste caso está inativo. Reative o cliente antes de reativar o caso."
        )

    if caso.ativo:
        raise SituacaoInvalidaError("Este caso já está ativo.")

    caso.ativo = True
    db.commit()
    db.refresh(caso)

    return caso
