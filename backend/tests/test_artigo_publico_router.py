import unittest
from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import get_db
from tests.integration import conectar_banco_ou_pular
from app.models.artigo import Artigo
from app.models.usuario import Usuario
from app.services.artigo_service import (
    criar_artigo,
    excluir_artigo,
    publicar_artigo,
)
from main import app


class ArtigoPublicoRouterIntegrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = conectar_banco_ou_pular(self)
        self.transaction = self.connection.begin()
        self.session = Session(bind=self.connection)
        agora = datetime.now(UTC).replace(tzinfo=None)
        self.usuario = Usuario(
            nome="Autor dos testes públicos",
            email=f"public-artigos-{uuid4()}@exemplo.com",
            senha_hash="hash-apenas-para-teste",
            criado_em=agora,
            atualizado_em=agora,
        )
        self.session.add(self.usuario)
        self.session.flush()

        def override_db():
            yield self.session

        app.dependency_overrides[get_db] = override_db
        self.client = TestClient(app)
        self.total_inicial = self.client.get(
            "/api/public/artigos",
            params={"por_pagina": 100},
        ).json()["total"]

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        self.session.close()

        if self.transaction.is_active:
            self.transaction.rollback()

        self.connection.close()

    def criar_publicado(self, titulo: str):
        artigo = criar_artigo(
            db=self.session,
            autor_id=self.usuario.id,
            titulo=titulo,
            resumo=f"Resumo de {titulo}",
            conteudo=f"# {titulo}\n\nConteúdo público.",
        )
        return publicar_artigo(db=self.session, artigo_id=artigo.id)

    def test_listagem_publica_nao_exige_autenticacao(self) -> None:
        artigo = self.criar_publicado("Artigo visível")

        resposta = self.client.get(
            "/api/public/artigos",
            params={"por_pagina": 100},
        )
        dados = resposta.json()

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(dados["total"], self.total_inicial + 1)
        item = next(item for item in dados["items"] if item["slug"] == artigo.slug)
        self.assertNotIn("status", item)
        self.assertNotIn("autor_id", item)

    def test_rascunhos_e_excluidos_nao_aparecem_publicamente(self) -> None:
        criar_artigo(
            db=self.session,
            autor_id=self.usuario.id,
            titulo="Rascunho oculto",
        )
        excluido = self.criar_publicado("Publicado excluído")
        excluir_artigo(db=self.session, artigo_id=excluido.id)

        resposta = self.client.get("/api/public/artigos")

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["total"], self.total_inicial)

    def test_registro_publicado_com_texto_em_branco_nao_e_exposto(self) -> None:
        artigo = Artigo(
            autor_id=self.usuario.id,
            titulo="Registro inconsistente",
            slug=f"registro-inconsistente-{uuid4()}",
            resumo="   ",
            conteudo="\n\t",
            status="publicado",
            publicado_em=datetime.now(UTC).replace(tzinfo=None),
        )
        self.session.add(artigo)
        self.session.flush()

        listagem = self.client.get("/api/public/artigos")
        consulta = self.client.get(f"/api/public/artigos/{artigo.slug}")

        self.assertEqual(listagem.status_code, 200)
        self.assertEqual(listagem.json()["total"], self.total_inicial)
        self.assertEqual(consulta.status_code, 404)

    def test_consulta_publica_utiliza_slug(self) -> None:
        artigo = self.criar_publicado("Consulta por slug")

        resposta = self.client.get(f"/api/public/artigos/{artigo.slug}")
        inexistente = self.client.get(
            "/api/public/artigos/publicacao-inexistente"
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["titulo"], artigo.titulo)
        self.assertEqual(inexistente.status_code, 404)

    def test_listagem_publica_valida_paginacao(self) -> None:
        self.criar_publicado("Primeira publicação")
        self.criar_publicado("Segunda publicação")

        resposta = self.client.get(
            "/api/public/artigos",
            params={"page": 1, "por_pagina": 1},
        )
        invalida = self.client.get(
            "/api/public/artigos",
            params={"por_pagina": 101},
        )

        self.assertEqual(resposta.status_code, 200)
        total_esperado = self.total_inicial + 2
        self.assertEqual(resposta.json()["total"], total_esperado)
        self.assertEqual(resposta.json()["total_paginas"], total_esperado)
        self.assertEqual(len(resposta.json()["items"]), 1)
        self.assertEqual(invalida.status_code, 422)


if __name__ == "__main__":
    unittest.main()
