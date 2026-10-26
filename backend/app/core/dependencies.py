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

        if (
            not isinstance(usuario_id_token, str)
            or not usuario_id_token.isdecimal()
            or int(usuario_id_token) <= 0
        ):
            raise _erro_credenciais("Token inválido.")

        usuario_id = int(usuario_id_token)

    except JWTError as erro:
        raise _erro_credenciais("Token inválido ou expirado.") from erro

    usuario = db.get(Usuario, usuario_id)

    if usuario is None or not usuario.ativo:
        raise _erro_credenciais("Usuário não encontrado ou inativo.")

    return usuario
