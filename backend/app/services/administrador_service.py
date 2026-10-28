from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError

from app.models.usuario import Usuario
from app.models.permissao import Permissao
from app.core.security import hash_password


MODULOS_PERMITIDOS = {
    "dashboard",
    "clientes",
    "casos",
    "artigos",
    "administradores",
}


def _validar_permissoes(permissoes):
    modulos = set()

    for permissao in permissoes:
        if permissao.modulo not in MODULOS_PERMITIDOS:
            raise ValueError(
                f"Módulo inválido: {permissao.modulo}"
            )

        if permissao.modulo in modulos:
            raise ValueError(
                f"Permissão duplicada: {permissao.modulo}"
            )

        modulos.add(permissao.modulo)

        if permissao.pode_editar:
            permissao.pode_visualizar = True


def listar_usuarios(db: Session):
    return (
        db.query(Usuario)
        .options(selectinload(Usuario.permissoes))
        .order_by(Usuario.nome)
        .all()
    )


def criar_usuario(db: Session, dados):
    _validar_permissoes(dados.permissoes)

    email = str(dados.email).strip().lower()

    existente = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if existente:
        raise ValueError("Este e-mail já está cadastrado.")

    usuario = Usuario(
        nome=dados.nome.strip(),
        email=email,
        senha_hash=hash_password(dados.senha),
        ativo=True,
        is_admin=False,
    )

    try:
        db.add(usuario)
        db.flush()

        for item in dados.permissoes:
            db.add(
                Permissao(
                    usuario_id=usuario.id,
                    modulo=item.modulo,
                    pode_visualizar=item.pode_visualizar,
                    pode_editar=item.pode_editar,
                )
            )

        db.commit()
        db.refresh(usuario)

        return usuario

    except IntegrityError:
        db.rollback()
        raise ValueError("Não foi possível cadastrar o usuário.")


def obter_usuario(db: Session, usuario_id: int):
    return (
        db.query(Usuario)
        .options(selectinload(Usuario.permissoes))
        .filter(Usuario.id == usuario_id)
        .first()
    )


def atualizar_usuario(db: Session, usuario_id: int, dados):
    usuario = obter_usuario(db, usuario_id)

    if not usuario:
        raise ValueError("Usuário não encontrado.")

    if usuario.is_admin and dados.ativo is False:
        raise ValueError(
            "Não é permitido desativar um administrador."
        )

    if dados.nome is not None:
        usuario.nome = dados.nome.strip()

    if dados.email is not None:
        email = str(dados.email).strip().lower()

        existente = db.query(Usuario).filter(
            Usuario.email == email,
            Usuario.id != usuario_id,
        ).first()

        if existente:
            raise ValueError("Este e-mail já está cadastrado.")

        usuario.email = email

    if dados.senha:
        usuario.senha_hash = hash_password(dados.senha)

    if dados.ativo is not None:
        usuario.ativo = dados.ativo

    if dados.permissoes is not None:
        _validar_permissoes(dados.permissoes)

        for permissao in list(usuario.permissoes):
            db.delete(permissao)

        # Apaga as permissões antigas no banco antes de inserir as novas.
        # Sem isso, o SQLAlchemy faz os INSERTs antes dos DELETEs e a regra
        # "uma permissão por módulo" (uq_permissao_usuario_modulo) dá erro.
        db.flush()

        for item in dados.permissoes:
            db.add(
                Permissao(
                    usuario_id=usuario.id,
                    modulo=item.modulo,
                    pode_visualizar=item.pode_visualizar,
                    pode_editar=item.pode_editar,
                )
            )

    try:
        db.commit()
        return obter_usuario(db, usuario_id)

    except IntegrityError:
        db.rollback()
        raise ValueError("Não foi possível atualizar o usuário.")


def desativar_usuario(db: Session, usuario_id: int):
    usuario = obter_usuario(db, usuario_id)

    if not usuario:
        raise ValueError("Usuário não encontrado.")

    if usuario.is_admin:
        raise ValueError(
            "Não é permitido desativar um administrador."
        )

    usuario.ativo = False
    db.commit()

    return usuario
