import unittest
import json
from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from tests.integration import conectar_banco_ou_pular
from app.models.artigo import Artigo
from app.models.usuario import Usuario
from scripts.migrar_noticias import ARQUIVO_PADRAO, migrar_noticias


class MigrarNoticiasIntegrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = conectar_banco_ou_pular(self)
        self.transaction = self.connection.begin()
        self.session = Session(bind=self.connection)
        agora = datetime.now(UTC).replace(tzinfo=None)
        self.usuario = Usuario(
            nome="Autor da migração",
            email=f"migracao-artigos-{uuid4()}@exemplo.com",
            senha_hash="hash-apenas-para-teste",
            criado_em=agora,
            atualizado_em=agora,
        )
        self.session.add(self.usuario)
        self.session.flush()
        self.diretorio_temporario = TemporaryDirectory()
        itens = json.loads(ARQUIVO_PADRAO.read_text(encoding="utf-8"))
        sufixo = uuid4().hex[:10]

        for item in itens:
            item["slug"] = f"{item['slug']}-{sufixo}"

        self.slugs = {item["slug"] for item in itens}
        self.arquivo_temporario = Path(
            self.diretorio_temporario.name,
            "noticias.json",
        )
        self.arquivo_temporario.write_text(
            json.dumps(itens, ensure_ascii=False),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.session.close()

        if self.transaction.is_active:
            self.transaction.rollback()

        self.connection.close()
        self.diretorio_temporario.cleanup()

    def test_migracao_preserva_conteudo_slugs_e_e_idempotente(self) -> None:
        primeira = migrar_noticias(
            db=self.session,
            autor_email=self.usuario.email,
            caminho=self.arquivo_temporario,
        )
        segunda = migrar_noticias(
            db=self.session,
            autor_email=self.usuario.email,
            caminho=self.arquivo_temporario,
        )
        artigos = list(
            self.session.scalars(
                select(Artigo).where(Artigo.autor_id == self.usuario.id)
            ).all()
        )

        self.assertEqual(primeira, (3, 0))
        self.assertEqual(segunda, (0, 3))
        self.assertEqual(len(artigos), 3)
        self.assertEqual({artigo.slug for artigo in artigos}, self.slugs)
        self.assertTrue(all(artigo.status == "publicado" for artigo in artigos))
        self.assertTrue(all(artigo.publicado_em is not None for artigo in artigos))
        self.assertTrue(all("\n\n" in artigo.conteudo for artigo in artigos))

    def test_migracao_exige_autor_ativo(self) -> None:
        self.usuario.ativo = False
        self.session.flush()

        with self.assertRaisesRegex(ValueError, "Autor não encontrado"):
            migrar_noticias(
                db=self.session,
                autor_email=self.usuario.email,
                caminho=self.arquivo_temporario,
            )


if __name__ == "__main__":
    unittest.main()
