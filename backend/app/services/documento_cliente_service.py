from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.documento_cliente import DocumentoCliente
from app.services.arquivo_service import normalizar_tag, validar_upload
from app.services.caso_service import buscar_caso
from app.services.cliente_service import buscar_cliente
from app.services.storage_service import enviar_arquivo, gerar_chave_cliente

class ClienteNaoEncontradoError(Exception):
    pass


def anexar_documento(
    db: Session,
    cliente_id: int,
    usuario_id: int,
    arquivo: UploadFile,
    tag: str,
) -> DocumentoCliente:
    if buscar_cliente(db=db, cliente_id=cliente_id) is None:
        raise ClienteNaoEncontradoError("Cliente não encontrado.")

    tag = normalizar_tag(tag)
    nome, tamanho, content_type = validar_upload(arquivo)
    chave = gerar_chave_cliente(cliente_id)

    enviar_arquivo(arquivo.file, chave, content_type)

    documento = DocumentoCliente(
        cliente_id=cliente_id,
        enviado_por_id=usuario_id,
        tag=tag,
        nome_original=nome,
        chave_storage=chave,
        content_type=content_type,
        tamanho_bytes=tamanho,
    )

    db.add(documento)
    db.commit()
    db.refresh(documento)

    return documento


def listar_documentos(
    db: Session,
    cliente_id: int,
    tag: str | None = None,
) -> list[DocumentoCliente]:
    consulta = select(DocumentoCliente).where(
        DocumentoCliente.cliente_id == cliente_id,
        DocumentoCliente.ativo.is_(True),
    )

    if tag and tag.strip():
        consulta = consulta.where(DocumentoCliente.tag == normalizar_tag(tag))

    consulta = consulta.order_by(
        DocumentoCliente.tag,
        DocumentoCliente.criado_em.desc(),
    )

    return list(db.scalars(consulta).all())


def buscar_documento(
    db: Session,
    cliente_id: int,
    documento_id: int,
) -> DocumentoCliente | None:
    return db.scalar(
        select(DocumentoCliente).where(
            DocumentoCliente.id == documento_id,
            DocumentoCliente.cliente_id == cliente_id,
            DocumentoCliente.ativo.is_(True),
        )
    )


def atualizar_tag(
    db: Session,
    cliente_id: int,
    documento_id: int,
    tag: str,
) -> DocumentoCliente | None:
    documento = buscar_documento(
        db=db,
        cliente_id=cliente_id,
        documento_id=documento_id,
    )

    if documento is None:
        return None

    documento.tag = normalizar_tag(tag)
    db.commit()
    db.refresh(documento)

    return documento


def inativar_documento(
    db: Session,
    cliente_id: int,
    documento_id: int,
) -> DocumentoCliente | None:
    documento = buscar_documento(
        db=db,
        cliente_id=cliente_id,
        documento_id=documento_id,
    )

    if documento is None:
        return None

    documento.ativo = False
    db.commit()
    db.refresh(documento)

    return documento


def listar_tags(db: Session) -> list[str]:
    """Tags já usadas em documentos ativos (para sugerir no formulário)."""

    consulta = (
        select(DocumentoCliente.tag)
        .where(DocumentoCliente.ativo.is_(True))
        .distinct()
        .order_by(DocumentoCliente.tag)
    )

    return list(db.scalars(consulta).all())


# ----------------------------------------------------------------------
# Documentos do cliente vistos a partir de um caso
# ----------------------------------------------------------------------
#
# O caso não guarda cópias: ele sempre mostra os documentos atuais do
# cliente vinculado. Assim, um documento enviado depois (ou corrigido)
# aparece automaticamente em todos os casos daquele cliente.


def listar_documentos_do_caso(
    db: Session,
    caso_id: int,
) -> list[DocumentoCliente] | None:
    caso = buscar_caso(db=db, caso_id=caso_id)

    if caso is None:
        return None

    return listar_documentos(db=db, cliente_id=caso.cliente_id)


def buscar_documento_do_caso(
    db: Session,
    caso_id: int,
    documento_id: int,
) -> DocumentoCliente | None:
    caso = buscar_caso(db=db, caso_id=caso_id)

    if caso is None:
        return None

    return buscar_documento(
        db=db,
        cliente_id=caso.cliente_id,
        documento_id=documento_id,
    )
