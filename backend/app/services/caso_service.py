from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.caso import Caso
from app.models.cliente import Cliente


class ClienteNaoEncontradoError(Exception):
    pass


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
) -> list[Caso]:
    consulta = select(Caso).where(Caso.ativo.is_(True))

    if cliente_id is not None:
        consulta = consulta.where(Caso.cliente_id == cliente_id)

    if tipo_atendimento:
        consulta = consulta.where(
            Caso.tipo_atendimento == tipo_atendimento.strip()
        )

    if q:
        termo = f"%{q.strip()}%"
        consulta = consulta.where(
            or_(
                Caso.titulo.ilike(termo),
                Caso.observacoes.ilike(termo),
            )
        )

    consulta = consulta.order_by(Caso.criado_em.desc())

    return list(db.scalars(consulta).all())


def buscar_caso(db: Session, caso_id: int) -> Caso | None:
    return db.scalar(
        select(Caso).where(
            Caso.id == caso_id,
            Caso.ativo.is_(True),
        )
    )


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
    caso = buscar_caso(db=db, caso_id=caso_id)

    if caso is None:
        return None

    caso.ativo = False
    db.commit()
    db.refresh(caso)

    return caso
