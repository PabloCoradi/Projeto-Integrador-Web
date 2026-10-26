
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import ALGORITHM, SECRET_KEY
from app.models.usuario import Usuario


security = HTTPBearer()


def _erro_credenciais(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_usuario_atual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Valida o token JWT e retorna o usuário autenticado.
    """

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        usuario_id_token = payload.get("sub")

        # Verifica se o ID informado no token é válido
        if (
            not isinstance(usuario_id_token, str)
            or not usuario_id_token.isdecimal()
            or int(usuario_id_token) <= 0
        ):
            raise _erro_credenciais("Token inválido.")

        usuario_id = int(usuario_id_token)

    except JWTError as erro:
        raise _erro_credenciais(
            "Token inválido ou expirado."
        ) from erro

    # Busca o usuário no banco de dados
    usuario = db.get(Usuario, usuario_id)

    # Verifica se o usuário existe e está ativo
    if usuario is None or not usuario.ativo:
        raise _erro_credenciais(
            "Usuário não encontrado ou inativo."
        )

    return usuario

def get_admin_atual(
    usuario: Usuario = Depends(get_usuario_atual),
) -> Usuario:
    """
    Permite acesso somente a usuários administradores.
    """
    if not usuario.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )

    return usuario

def exigir_permissao(modulo: str, acao: str = "visualizar"):
    """
    Valida se o usuário pode visualizar ou editar determinado módulo.
    Administradores possuem acesso total.
    """

    if acao not in {"visualizar", "editar"}:
        raise ValueError("Ação de permissão inválida.")

    def verificar_permissao(
        usuario: Usuario = Depends(get_usuario_atual),
        db: Session = Depends(get_db),
    ) -> Usuario:

        if usuario.is_admin:
            return usuario

        from app.models.permissao import Permissao

        permissao = (
            db.query(Permissao)
            .filter(
                Permissao.usuario_id == usuario.id,
                Permissao.modulo == modulo,
            )
            .first()
        )

        if permissao is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Você não possui acesso ao módulo {modulo}.",
            )

        if acao == "visualizar" and not (
            permissao.pode_visualizar or permissao.pode_editar
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não possui permissão para visualizar este módulo.",
            )

        if acao == "editar" and not permissao.pode_editar:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não possui permissão para editar este módulo.",
            )

        return usuario

    return verificar_permissao
