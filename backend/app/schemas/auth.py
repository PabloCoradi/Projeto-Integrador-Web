
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(
        min_length=1,
        max_length=128
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AlterarMinhaSenhaRequest(BaseModel):
    senha_atual: str = Field(
        min_length=1,
        max_length=128
    )
    nova_senha: str = Field(
        min_length=8,
        max_length=128
    )
    confirmar_senha: str = Field(
        min_length=8,
        max_length=128
    )