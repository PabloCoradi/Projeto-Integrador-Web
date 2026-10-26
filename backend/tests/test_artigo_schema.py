import unittest
from datetime import datetime
from types import SimpleNamespace

from pydantic import ValidationError

from app.schemas.artigo import (
    ArtigoAdminPageResponse,
    ArtigoAdminResponse,
    ArtigoCreate,
    ArtigoPublicPageResponse,
    ArtigoPublicResponse,
    ArtigoUpdate,
)


class ArtigoSchemaTest(unittest.TestCase):
    def setUp(self) -> None:
        self.agora = datetime(2026, 10, 14, 18, 30)
        self.artigo = SimpleNamespace(
            id=1,
            autor_id=2,
            titulo="Direitos trabalhistas",
            slug="direitos-trabalhistas",
            resumo="Resumo público",
            conteudo="# Conteúdo em Markdown",
            status="publicado",
            publicado_em=self.agora,
            excluido_em=None,
            criado_em=self.agora,
            atualizado_em=self.agora,
        )

    def test_criacao_normaliza_titulo_e_aceita_rascunho_incompleto(self) -> None:
        dados = ArtigoCreate(titulo="  Novo artigo  ")

        self.assertEqual(dados.titulo, "Novo artigo")
        self.assertIsNone(dados.resumo)
        self.assertIsNone(dados.conteudo)

    def test_criacao_rejeita_titulo_invalido(self) -> None:
        for titulo in (" ", "a", "x" * 251):
            with self.subTest(titulo=titulo), self.assertRaises(ValidationError):
                ArtigoCreate(titulo=titulo)

    def test_criacao_rejeita_campos_controlados_pelo_backend(self) -> None:
        for campo, valor in (
            ("autor_id", 99),
            ("slug", "slug-forcado"),
            ("status", "publicado"),
            ("publicado_em", self.agora),
        ):
            with self.subTest(campo=campo), self.assertRaises(ValidationError):
                ArtigoCreate(titulo="Novo artigo", **{campo: valor})

    def test_atualizacao_aceita_campos_parciais(self) -> None:
        dados = ArtigoUpdate(resumo=None, conteudo="Novo conteúdo")

        self.assertEqual(
            dados.model_dump(exclude_unset=True),
            {"resumo": None, "conteudo": "Novo conteúdo"},
        )

    def test_atualizacao_rejeita_corpo_vazio_ou_titulo_invalido(self) -> None:
        casos = ({}, {"titulo": None}, {"titulo": " "}, {"titulo": "a"})

        for dados in casos:
            with self.subTest(dados=dados), self.assertRaises(ValidationError):
                ArtigoUpdate(**dados)

    def test_atualizacao_rejeita_campos_controlados_pelo_backend(self) -> None:
        with self.assertRaises(ValidationError):
            ArtigoUpdate(status="publicado")

    def test_resposta_administrativa_mapeia_todos_os_campos(self) -> None:
        resposta = ArtigoAdminResponse.model_validate(self.artigo)

        self.assertEqual(resposta.autor_id, 2)
        self.assertEqual(resposta.status, "publicado")
        self.assertEqual(resposta.conteudo, "# Conteúdo em Markdown")

    def test_resposta_publica_nao_expoe_campos_internos(self) -> None:
        resposta = ArtigoPublicResponse.model_validate(self.artigo)
        dados = resposta.model_dump()

        self.assertEqual(
            set(dados),
            {
                "titulo",
                "slug",
                "resumo",
                "conteudo",
                "publicado_em",
            },
        )
        self.assertNotIn("autor_id", dados)
        self.assertNotIn("status", dados)
        self.assertNotIn("excluido_em", dados)

    def test_resposta_publica_exige_conteudo_publicavel(self) -> None:
        artigo_incompleto = SimpleNamespace(**vars(self.artigo))
        artigo_incompleto.resumo = None

        with self.assertRaises(ValidationError):
            ArtigoPublicResponse.model_validate(artigo_incompleto)

    def test_respostas_paginadas_validam_limites(self) -> None:
        administrativa = ArtigoAdminPageResponse(
            items=[ArtigoAdminResponse.model_validate(self.artigo)],
            page=1,
            por_pagina=10,
            total=1,
            total_paginas=1,
        )
        publica = ArtigoPublicPageResponse(
            items=[ArtigoPublicResponse.model_validate(self.artigo)],
            page=1,
            por_pagina=100,
            total=1,
            total_paginas=1,
        )

        self.assertEqual(administrativa.total, 1)
        self.assertEqual(publica.por_pagina, 100)

        for dados in (
            {"page": 0, "por_pagina": 10},
            {"page": 1, "por_pagina": 0},
            {"page": 1, "por_pagina": 101},
        ):
            with self.subTest(dados=dados), self.assertRaises(ValidationError):
                ArtigoPublicPageResponse(
                    items=[],
                    total=0,
                    total_paginas=0,
                    **dados,
                )


if __name__ == "__main__":
    unittest.main()
