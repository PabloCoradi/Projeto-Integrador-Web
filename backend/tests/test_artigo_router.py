import unittest
from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import get_db
from tests.integration import conectar_banco_ou_pular
from app.core.dependencies import get_usuario_atual
from app.core.security import criar_access_token
from app.models.usuario import Usuario
from main import app


class ArtigoRouterIntegrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = conectar_banco_ou_pular(self)
        self.transaction = self.connection.begin()
        self.session = Session(bind=self.connection)
        agora = datetime.now(UTC).replace(tzinfo=None)
        self.usuario = Usuario(
            nome="Autor dos testes HTTP",
            email=f"router-artigos-{uuid4()}@exemplo.com",
            senha_hash="hash-apenas-para-teste",
            criado_em=agora,
            atualizado_em=agora,
        )
        self.session.add(self.usuario)
        self.session.flush()

        def override_db():
            yield self.session

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_usuario_atual] = lambda: self.usuario
        self.client = TestClient(app)
        self.total_inicial = self.client.get("/api/artigos").json()["total"]

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        self.session.close()

        if self.transaction.is_active:
            self.transaction.rollback()

        self.connection.close()

    def criar_artigo(self, titulo: str = "Artigo de teste") -> dict:
        resposta = self.client.post(
            "/api/artigos",
            json={"titulo": titulo},
        )
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()

    def test_rotas_exigem_autenticacao(self) -> None:
        del app.dependency_overrides[get_usuario_atual]

        requisicoes = (
            ("GET", "/api/artigos", None),
            ("POST", "/api/artigos", {"titulo": "Sem autenticação"}),
            ("GET", "/api/artigos/1", None),
            ("PATCH", "/api/artigos/1", {"titulo": "Sem autenticação"}),
            ("POST", "/api/artigos/1/publicar", None),
            ("POST", "/api/artigos/1/despublicar", None),
            ("DELETE", "/api/artigos/1", None),
        )

        for metodo, caminho, corpo in requisicoes:
            with self.subTest(metodo=metodo, caminho=caminho):
                resposta = self.client.request(metodo, caminho, json=corpo)
                self.assertEqual(resposta.status_code, 401)
                self.assertEqual(resposta.headers["www-authenticate"], "Bearer")

    def test_token_com_identificador_invalido_retorna_401(self) -> None:
        del app.dependency_overrides[get_usuario_atual]
        token = criar_access_token({"sub": "nao-numerico"})

        resposta = self.client.get(
            "/api/artigos",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(resposta.status_code, 401)
        self.assertEqual(resposta.headers["www-authenticate"], "Bearer")

    def test_usuario_inativo_nao_pode_acessar(self) -> None:
        del app.dependency_overrides[get_usuario_atual]
        self.usuario.ativo = False
        self.session.flush()
        token = criar_access_token(
            {"sub": str(self.usuario.id), "email": self.usuario.email}
        )

        resposta = self.client.get(
            "/api/artigos",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(resposta.status_code, 401)

    def test_criar_e_consultar_rascunho(self) -> None:
        criado = self.criar_artigo("Direito à saúde")

        self.assertEqual(criado["autor_id"], self.usuario.id)
        self.assertEqual(criado["slug"], "direito-a-saude")
        self.assertEqual(criado["status"], "rascunho")

        resposta = self.client.get(f"/api/artigos/{criado['id']}")

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["id"], criado["id"])

    def test_listar_com_paginacao_busca_e_status(self) -> None:
        self.criar_artigo("Primeiro rascunho")
        publicado = self.criar_artigo("Artigo público pesquisável")
        self.criar_artigo("Segundo rascunho")
        edicao = self.client.patch(
            f"/api/artigos/{publicado['id']}",
            json={"resumo": "Resumo", "conteudo": "Conteúdo"},
        )
        self.assertEqual(edicao.status_code, 200, edicao.text)
        publicacao = self.client.post(
            f"/api/artigos/{publicado['id']}/publicar"
        )
        self.assertEqual(publicacao.status_code, 200, publicacao.text)

        resposta = self.client.get(
            "/api/artigos",
            params={
                "page": 1,
                "por_pagina": 1,
                "status": "publicado",
                "q": "pesquisável",
            },
        )
        dados = resposta.json()

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(dados["total"], 1)
        self.assertEqual(dados["total_paginas"], 1)
        self.assertEqual(len(dados["items"]), 1)
        self.assertEqual(dados["items"][0]["id"], publicado["id"])

    def test_listagem_valida_parametros(self) -> None:
        for parametros in (
            {"page": 0},
            {"por_pagina": 0},
            {"por_pagina": 101},
            {"status": "arquivado"},
        ):
            with self.subTest(parametros=parametros):
                resposta = self.client.get(
                    "/api/artigos",
                    params=parametros,
                )
                self.assertEqual(resposta.status_code, 422)

    def test_editar_preserva_slug_e_rejeita_campos_internos(self) -> None:
        criado = self.criar_artigo()
        resposta = self.client.patch(
            f"/api/artigos/{criado['id']}",
            json={"titulo": "Título editado", "resumo": "Resumo"},
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["titulo"], "Título editado")
        self.assertEqual(resposta.json()["slug"], criado["slug"])

        invalida = self.client.patch(
            f"/api/artigos/{criado['id']}",
            json={"status": "publicado"},
        )
        self.assertEqual(invalida.status_code, 422)

    def test_publicar_e_despublicar(self) -> None:
        criado = self.criar_artigo()

        incompleto = self.client.post(
            f"/api/artigos/{criado['id']}/publicar"
        )
        self.assertEqual(incompleto.status_code, 422)

        edicao = self.client.patch(
            f"/api/artigos/{criado['id']}",
            json={"resumo": "Resumo", "conteudo": "# Conteúdo"},
        )
        self.assertEqual(edicao.status_code, 200, edicao.text)
        publicado = self.client.post(
            f"/api/artigos/{criado['id']}/publicar"
        )
        primeira_data = publicado.json()["publicado_em"]

        self.assertEqual(publicado.status_code, 200, publicado.text)
        self.assertEqual(publicado.json()["status"], "publicado")
        self.assertIsNotNone(primeira_data)

        despublicado = self.client.post(
            f"/api/artigos/{criado['id']}/despublicar"
        )
        self.assertEqual(despublicado.status_code, 200)
        self.assertEqual(despublicado.json()["status"], "rascunho")
        self.assertEqual(despublicado.json()["publicado_em"], primeira_data)

    def test_excluir_logicamente(self) -> None:
        criado = self.criar_artigo()

        excluido = self.client.delete(f"/api/artigos/{criado['id']}")
        consulta = self.client.get(f"/api/artigos/{criado['id']}")
        listagem = self.client.get("/api/artigos").json()

        self.assertEqual(excluido.status_code, 204)
        self.assertEqual(excluido.content, b"")
        self.assertEqual(consulta.status_code, 404)
        self.assertEqual(listagem["total"], self.total_inicial)


if __name__ == "__main__":
    unittest.main()
