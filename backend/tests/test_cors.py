import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from main import configurar_cors


class CorsTest(unittest.TestCase):
    def setUp(self) -> None:
        aplicacao = FastAPI()
        configurar_cors(
            aplicacao,
            ["http://localhost:5173", "http://localhost:5174"],
        )

        @aplicacao.get("/ping")
        def ping():
            return {"status": "ok"}

        self.client = TestClient(aplicacao)

    def tearDown(self) -> None:
        self.client.close()

    def test_preflight_permite_painel_e_site_configurados(self) -> None:
        for origem in ("http://localhost:5173", "http://localhost:5174"):
            with self.subTest(origem=origem):
                resposta = self.client.options(
                    "/ping",
                    headers={
                        "Origin": origem,
                        "Access-Control-Request-Method": "GET",
                    },
                )

                self.assertEqual(resposta.status_code, 200)
                self.assertEqual(
                    resposta.headers["access-control-allow-origin"],
                    origem,
                )
                self.assertEqual(
                    resposta.headers["access-control-allow-credentials"],
                    "true",
                )

    def test_preflight_bloqueia_origem_nao_configurada(self) -> None:
        resposta = self.client.options(
            "/ping",
            headers={
                "Origin": "https://origem-maliciosa.example",
                "Access-Control-Request-Method": "GET",
            },
        )

        self.assertEqual(resposta.status_code, 400)
        self.assertNotIn("access-control-allow-origin", resposta.headers)

    def test_configuracao_aceita_origens_de_producao_e_remove_duplicatas(self) -> None:
        configuracao = Settings(
            DATABASE_URL="postgresql+psycopg2://usuario:senha@localhost/banco",
            SECRET_KEY="segredo-de-teste",
            CORS_ORIGINS=(
                "https://painel.example.com/, https://site.example.com,"
                "https://site.example.com"
            ),
            _env_file=None,
        )

        self.assertEqual(
            configuracao.cors_origins,
            ["https://painel.example.com", "https://site.example.com"],
        )

    def test_configuracao_padrao_inclui_painel_e_site_locais(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            configuracao = Settings(
                DATABASE_URL="postgresql+psycopg2://usuario:senha@localhost/banco",
                SECRET_KEY="segredo-de-teste",
                RUSTFS_ENDPOINT='http://localhost:9000',
                RUSTFS_ACCESS_KEY='teste',
                RUSTFS_SECRET_KEY='teste',
                _env_file=None,
            )

        self.assertEqual(
            configuracao.cors_origins,
            [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
            ],
        )

    def test_configuracao_rejeita_curinga_e_url_com_caminho(self) -> None:
        for origens in ("*", "https://example.com/caminho"):
            with self.subTest(origens=origens), self.assertRaises(ValidationError):
                Settings(
                    DATABASE_URL="postgresql+psycopg2://usuario:senha@localhost/banco",
                    SECRET_KEY="segredo-de-teste",
                    CORS_ORIGINS=origens,
                    _env_file=None,
                )


if __name__ == "__main__":
    unittest.main()
