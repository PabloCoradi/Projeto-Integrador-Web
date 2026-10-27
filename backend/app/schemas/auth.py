
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(
        min_length=1,
        max_length=128
    )


class RedefinirSenhaRequest(BaseModel):
    email: EmailStr
    nova_senha: str = Field(
        min_length=8,
        max_length=128
    )
    confirmar_senha: str = Field(
        min_length=8,
        max_length=128
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
