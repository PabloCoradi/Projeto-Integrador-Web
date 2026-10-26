import unittest
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from tests.integration import conectar_banco_ou_pular
from app.models.usuario import Usuario
from app.services.artigo_service import (
    ArtigoInvalidoError,
    ArtigoNaoEncontradoError,
    ArtigoPublicacaoError,
    AutorInvalidoError,
    atualizar_artigo,
    buscar_artigo,
    criar_artigo,
    despublicar_artigo,
    excluir_artigo,
    gerar_slug_base,
    publicar_artigo,
)


class ArtigoServiceIntegrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = conectar_banco_ou_pular(self)
        self.transaction = self.connection.begin()
        self.session = Session(bind=self.connection)
        agora = datetime.now(UTC).replace(tzinfo=None)
        self.usuario = Usuario(
            nome="Autor dos testes de service",
            email=f"service-artigos-{uuid4()}@exemplo.com",
            senha_hash="hash-apenas-para-teste",
            criado_em=agora,
            atualizado_em=agora,
        )
        self.session.add(self.usuario)
        self.session.flush()

    def tearDown(self) -> None:
        self.session.close()

        if self.transaction.is_active:
            self.transaction.rollback()

        self.connection.close()

    def criar_rascunho(self, **campos):
        dados = {
            "db": self.session,
            "autor_id": self.usuario.id,
            "titulo": "Direitos trabalhistas",
        }
        dados.update(campos)
        return criar_artigo(**dados)

    def test_gerar_slug_base_remove_acentos_e_caracteres_invalidos(self) -> None:
        self.assertEqual(
            gerar_slug_base("  Direito à Saúde: guia 2026!  "),
            "direito-a-saude-guia-2026",
        )
        self.assertEqual(gerar_slug_base("!!!"), "artigo")

    def test_criar_artigo_como_rascunho(self) -> None:
        artigo = self.criar_rascunho(titulo="  Direito à Saúde  ")

        self.assertEqual(artigo.titulo, "Direito à Saúde")
        self.assertEqual(artigo.slug, "direito-a-saude")
        self.assertEqual(artigo.status, "rascunho")
        self.assertEqual(artigo.autor_id, self.usuario.id)
        self.assertIsNone(artigo.publicado_em)

    def test_slug_recebe_sufixo_e_permanece_reservado_apos_exclusao(self) -> None:
        primeiro = self.criar_rascunho()
        segundo = self.criar_rascunho()
        excluir_artigo(db=self.session, artigo_id=segundo.id)
        terceiro = self.criar_rascunho()

        self.assertEqual(primeiro.slug, "direitos-trabalhistas")
        self.assertEqual(segundo.slug, "direitos-trabalhistas-2")
        self.assertEqual(terceiro.slug, "direitos-trabalhistas-3")

    def test_criacao_rejeita_autor_inativo(self) -> None:
        self.usuario.ativo = False
        self.session.commit()

        with self.assertRaises(AutorInvalidoError):
            self.criar_rascunho()

    def test_atualizar_artigo_preserva_slug_e_status(self) -> None:
        artigo = self.criar_rascunho()
        slug_original = artigo.slug

        atualizado = atualizar_artigo(
            db=self.session,
            artigo_id=artigo.id,
            campos={
                "titulo": "Novo título",
                "resumo": "Novo resumo",
                "conteudo": "# Novo conteúdo",
            },
        )

        self.assertEqual(atualizado.titulo, "Novo título")
        self.assertEqual(atualizado.slug, slug_original)
        self.assertEqual(atualizado.status, "rascunho")

    def test_atualizacao_rejeita_campos_internos(self) -> None:
        artigo = self.criar_rascunho()

        for campo in ("autor_id", "slug", "status", "publicado_em"):
            with self.subTest(campo=campo), self.assertRaises(
                ArtigoInvalidoError
            ):
                atualizar_artigo(
                    db=self.session,
                    artigo_id=artigo.id,
                    campos={campo: "valor"},
                )

    def test_publicacao_exige_resumo_e_conteudo(self) -> None:
        artigo = self.criar_rascunho()

        with self.assertRaises(ArtigoPublicacaoError) as contexto:
            publicar_artigo(db=self.session, artigo_id=artigo.id)

        self.assertIn("resumo", str(contexto.exception))
        self.assertIn("conteúdo", str(contexto.exception))
        self.assertEqual(artigo.status, "rascunho")

    def test_publicar_despublicar_e_republicar_preserva_primeira_data(self) -> None:
        artigo = self.criar_rascunho(
            resumo="Resumo válido",
            conteudo="# Conteúdo válido",
        )

        publicado = publicar_artigo(db=self.session, artigo_id=artigo.id)
        primeira_publicacao = publicado.publicado_em
        self.assertEqual(publicado.status, "publicado")
        self.assertIsNotNone(primeira_publicacao)

        despublicado = despublicar_artigo(
            db=self.session,
            artigo_id=artigo.id,
        )
        self.assertEqual(despublicado.status, "rascunho")
        self.assertEqual(despublicado.publicado_em, primeira_publicacao)

        republicado = publicar_artigo(db=self.session, artigo_id=artigo.id)
        self.assertEqual(republicado.status, "publicado")
        self.assertEqual(republicado.publicado_em, primeira_publicacao)

    def test_publicar_e_despublicar_sao_idempotentes(self) -> None:
        artigo = self.criar_rascunho(
            resumo="Resumo válido",
            conteudo="Conteúdo válido",
        )
        primeira_publicacao = publicar_artigo(
            db=self.session,
            artigo_id=artigo.id,
        ).publicado_em

        publicado_novamente = publicar_artigo(
            db=self.session,
            artigo_id=artigo.id,
        )
        self.assertEqual(publicado_novamente.publicado_em, primeira_publicacao)

        despublicar_artigo(db=self.session, artigo_id=artigo.id)
        despublicado_novamente = despublicar_artigo(
            db=self.session,
            artigo_id=artigo.id,
        )
        self.assertEqual(despublicado_novamente.status, "rascunho")
        self.assertEqual(despublicado_novamente.publicado_em, primeira_publicacao)

    def test_edicao_nao_pode_invalidar_artigo_publicado(self) -> None:
        artigo = self.criar_rascunho(
            resumo="Resumo válido",
            conteudo="Conteúdo válido",
        )
        publicar_artigo(db=self.session, artigo_id=artigo.id)

        for campos in ({"resumo": None}, {"conteudo": "   "}):
            with self.subTest(campos=campos), self.assertRaises(
                ArtigoPublicacaoError
            ):
                atualizar_artigo(
                    db=self.session,
                    artigo_id=artigo.id,
                    campos=campos,
                )

        self.assertEqual(artigo.resumo, "Resumo válido")
        self.assertEqual(artigo.conteudo, "Conteúdo válido")

    def test_exclusao_logica_oculta_e_bloqueia_alteracoes(self) -> None:
        artigo = self.criar_rascunho(
            resumo="Resumo válido",
            conteudo="Conteúdo válido",
        )
        excluido = excluir_artigo(db=self.session, artigo_id=artigo.id)

        self.assertIsNotNone(excluido.excluido_em)
        self.assertIsNone(buscar_artigo(db=self.session, artigo_id=artigo.id))

        operacoes = (
            lambda: atualizar_artigo(
                db=self.session,
                artigo_id=artigo.id,
                campos={"titulo": "Título alterado"},
            ),
            lambda: publicar_artigo(db=self.session, artigo_id=artigo.id),
            lambda: despublicar_artigo(db=self.session, artigo_id=artigo.id),
            lambda: excluir_artigo(db=self.session, artigo_id=artigo.id),
        )

        for operacao in operacoes:
            with self.subTest(operacao=operacao), self.assertRaises(
                ArtigoNaoEncontradoError
            ):
                operacao()


if __name__ == "__main__":
    unittest.main()
