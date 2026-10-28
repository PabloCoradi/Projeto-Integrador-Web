"""
Base compartilhada pelos testes que rodam num SQLite em memória.

Assim esses testes não dependem do PostgreSQL/Docker: cada teste recebe um
banco novo e vazio, que é apagado no final.
"""

import os
import unittest

# As configurações exigem estas variáveis. Se o .env ou o ambiente já tiverem
# valores, eles continuam valendo; o banco real nunca é usado nestes testes,
# porque a dependência get_db é substituída logo abaixo.
# (O endereço padrão abaixo nunca conecta de propósito: assim os testes de
# integração antigos, que precisam do PostgreSQL, são pulados em vez de falhar.)
os.environ.setdefault(
    "DATABASE_URL", "postgresql://sem_banco:sem_banco@127.0.0.1:1/sem_banco"
)
os.environ.setdefault("SECRET_KEY", "chave-apenas-para-testes")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.database import Base, get_db  # noqa: E402
from app.core.limiter import limiter  # noqa: E402
from app.core.security import criar_access_token, hash_password  # noqa: E402
from app.models.permissao import Permissao  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402
from main import app  # noqa: E402  (importa todos os models via routers)


class TesteComBancoEmMemoria(unittest.TestCase):
    """Cria um banco SQLite novo para cada teste e um cliente HTTP da API."""

    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine, autoflush=False)()

        def override_get_db():
            yield self.session

        app.dependency_overrides[get_db] = override_get_db

        # O login tem limite de 5 tentativas por minuto; nos testes isso
        # atrapalharia, então o limitador fica desligado.
        self._limiter_estava_ativo = limiter.enabled
        limiter.enabled = False

        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        limiter.enabled = self._limiter_estava_ativo
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    # ------------------------------------------------------------------
    # Ajudantes
    # ------------------------------------------------------------------

    def criar_usuario(
        self,
        email: str = "usuario@exemplo.com",
        senha: str = "SenhaForte123",
        is_admin: bool = False,
        ativo: bool = True,
    ) -> Usuario:
        usuario = Usuario(
            nome="Usuário de Teste",
            email=email,
            senha_hash=hash_password(senha),
            is_admin=is_admin,
            ativo=ativo,
        )
        self.session.add(usuario)
        self.session.commit()
        self.session.refresh(usuario)
        return usuario

    def dar_permissao(
        self,
        usuario: Usuario,
        modulo: str,
        pode_visualizar: bool = False,
        pode_editar: bool = False,
    ) -> None:
        self.session.add(
            Permissao(
                usuario_id=usuario.id,
                modulo=modulo,
                pode_visualizar=pode_visualizar,
                pode_editar=pode_editar,
            )
        )
        self.session.commit()

    def cabecalho_auth(self, usuario: Usuario) -> dict:
        token = criar_access_token({"sub": str(usuario.id), "email": usuario.email})
        return {"Authorization": f"Bearer {token}"}
