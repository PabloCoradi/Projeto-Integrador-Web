from pydantic import BaseModel, EmailStr, Field


class PermissaoInput(BaseModel):
    modulo: str = Field(min_length=1, max_length=50)
    pode_visualizar: bool = False
    pode_editar: bool = False


class UsuarioAdminCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    permissoes: list[PermissaoInput] = []


class UsuarioAdminUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = None
    senha: str | None = Field(default=None, min_length=8, max_length=128)
    ativo: bool | None = None
    permissoes: list[PermissaoInput] | None = None


class PermissaoResponse(BaseModel):
    modulo: str
    pode_visualizar: bool
    pode_editar: bool

    model_config = {"from_attributes": True}


class UsuarioAdminResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    ativo: bool
    is_admin: bool
    permissoes: list[PermissaoResponse] = []

    model_config = {"from_attributes": True}
