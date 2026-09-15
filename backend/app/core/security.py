from datetime import datetime, timedelta, timezone

from jose import jwt
from pwdlib import PasswordHash

from app.core.config import settings
# ============================================================
# SENHAS
# ============================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Gera o hash seguro de uma senha."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash."""
    return password_hash.verify(password, hashed_password)


# ============================================================
# JWT
# ============================================================

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def criar_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """Cria um token JWT para autenticação."""

    dados = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    dados.update({"exp": expire})

    return jwt.encode(
        dados,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )