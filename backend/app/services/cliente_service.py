from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cliente import Cliente


def criar_cliente(
    db: Session,
    nome: str,
    cpf_cnpj: str | None = None,
    email: str | None = None,
    telefone: str | None = None,
    endereco: str | None = None,
    observacoes: str | None = None,
) -> Cliente:

    cpf_cnpj = cpf_cnpj.strip() if cpf_cnpj else None

    if cpf_cnpj:
        cliente_existente = db.scalar(
            select(Cliente).where(
                Cliente.cpf_cnpj == cpf_cnpj,
            )
        )

        if cliente_existente:
            raise ValueError(
                "Já existe um cliente cadastrado com este CPF/CNPJ."
            )

    cliente = Cliente(
        nome=nome.strip(),
        cpf_cnpj=cpf_cnpj,
        email=email.strip().lower() if email else None,
        telefone=telefone.strip() if telefone else None,
        endereco=endereco.strip() if endereco else None,
        observacoes=observacoes.strip() if observacoes else None,
    )

    try:
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    except IntegrityError:
        db.rollback()

        raise ValueError(
            "Não foi possível cadastrar o cliente. "
            "Verifique os dados informados."
        )

    return cliente


def listar_clientes(
    db: Session,
) -> list[Cliente]:

    clientes = db.scalars(
        select(Cliente)
        .where(Cliente.ativo.is_(True))
        .order_by(Cliente.nome)
    ).all()

    return clientes


def buscar_cliente(
    db: Session,
    cliente_id: int,
) -> Cliente | None:

    return db.scalar(
        select(Cliente).where(
            Cliente.id == cliente_id,
            Cliente.ativo.is_(True),
        )
    )


def atualizar_cliente(
    db: Session,
    cliente_id: int,
    nome: str | None = None,
    cpf_cnpj: str | None = None,
    email: str | None = None,
    telefone: str | None = None,
    endereco: str | None = None,
    observacoes: str | None = None,
) -> Cliente | None:

    cliente = buscar_cliente(
        db=db,
        cliente_id=cliente_id,
    )

    if cliente is None:
        return None

    if cpf_cnpj is not None:
        cpf_cnpj = cpf_cnpj.strip() or None

        if cpf_cnpj:
            cliente_existente = db.scalar(
                select(Cliente).where(
                    Cliente.cpf_cnpj == cpf_cnpj,
                    Cliente.id != cliente_id,
                )
            )

            if cliente_existente:
                raise ValueError(
                    "Já existe outro cliente cadastrado "
                    "com este CPF/CNPJ."
                )

        cliente.cpf_cnpj = cpf_cnpj

    if nome is not None:
        cliente.nome = nome.strip()

    if email is not None:
        cliente.email = email.strip().lower() or None

    if telefone is not None:
        cliente.telefone = telefone.strip() or None

    if endereco is not None:
        cliente.endereco = endereco.strip() or None

    if observacoes is not None:
        cliente.observacoes = observacoes.strip() or None

    try:
        db.commit()
        db.refresh(cliente)

    except IntegrityError:
        db.rollback()

        raise ValueError(
            "Não foi possível atualizar o cliente. "
            "Verifique os dados informados."
        )

    return cliente


def inativar_cliente(
    db: Session,
    cliente_id: int,
) -> Cliente | None:

    cliente = db.get(Cliente, cliente_id)

    if cliente is None:
        return None

    cliente.ativo = False

    db.commit()
    db.refresh(cliente)

    return cliente