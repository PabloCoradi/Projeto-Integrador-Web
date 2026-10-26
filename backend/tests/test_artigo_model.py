import unittest
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from tests.integration import conectar_banco_ou_pular
from app.models.artigo import Artigo
from app.models.usuario import Usuario


class ArtigoModelIntegrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = conectar_banco_ou_pular(self)
        self.transaction = self.connection.begin()
        self.session = Session(bind=self.connection)
        agora = datetime.now(UTC).replace(tzinfo=None)

        self.usuario = Usuario(
            nome="Usuário de teste dos artigos",
            email=f"artigos-{uuid4()}@exemplo.com",
            senha_hash="hash-apenas-para-teste",
            criado_em=agora,
            atualizado_em=agora,
        )
        self.session.add(self.usuario)
        self.session.flush()

    def tearDown(self) -> None:
        self.session.rollback()
        self.session.close()

        if self.transaction.is_active:
            self.transaction.rollback()

        self.connection.close()

    def novo_artigo(self, **campos) -> Artigo:
        dados = {
            "autor_id": self.usuario.id,
            "titulo": "Direito Trabalhista",
            "slug": f"direito-trabalhista-{uuid4()}",
        }
        dados.update(campos)
        return Artigo(**dados)

    def test_cria_rascunho_com_campos_opcionais_vazios(self) -> None:
        artigo = self.novo_artigo()
        self.session.add(artigo)
        self.session.flush()

        self.assertIsNotNone(artigo.id)
        self.assertEqual(artigo.status, "rascunho")
        self.assertIsNone(artigo.resumo)
        self.assertIsNone(artigo.conteudo)
        self.assertIsNone(artigo.publicado_em)
        self.assertIsNone(artigo.excluido_em)
        self.assertIsNotNone(artigo.criado_em)
        self.assertIsNotNone(artigo.atualizado_em)
        self.assertEqual(artigo.autor.id, self.usuario.id)

    def test_rejeita_slug_duplicado(self) -> None:
        slug = f"slug-repetido-{uuid4()}"
        self.session.add(self.novo_artigo(slug=slug))
        self.session.flush()

        self.session.add(
            self.novo_artigo(
                titulo="Outro título",
                slug=slug,
            )
        )

        with self.assertRaises(IntegrityError):
            self.session.flush()

    def test_rejeita_status_invalido(self) -> None:
        artigo = self.novo_artigo(status="arquivado")
        self.session.add(artigo)

        with self.assertRaises(IntegrityError):
            self.session.flush()

    def test_rejeita_autor_inexistente(self) -> None:
        artigo = self.novo_artigo(autor_id=2_147_483_647)
        self.session.add(artigo)

        with self.assertRaises(IntegrityError):
            self.session.flush()


if __name__ == "__main__":
    unittest.main()
