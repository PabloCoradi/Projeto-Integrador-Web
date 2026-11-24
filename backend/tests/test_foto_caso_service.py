"""Testes unitários do processamento e persistência das fotos de casos."""

from io import BytesIO
import unittest
from unittest.mock import patch

from fastapi import UploadFile
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.caso import Caso
from app.models.cliente import Cliente
from app.schemas.caso import CasoResponse
from app.services.foto_caso_service import (
    FotoCasoInvalidaError,
    gerar_link_foto_caso,
    processar_foto,
    remover_foto_caso,
    salvar_foto_caso,
)


def criar_png(tamanho=(32, 24), transparente=False) -> bytes:
    buffer = BytesIO()
    imagem = Image.new("RGBA" if transparente else "RGB", tamanho, (0, 128, 128, 0) if transparente else "teal")
    imagem.save(buffer, format="PNG")
    return buffer.getvalue()


class ProcessamentoFotoCasoTest(unittest.TestCase):
    def test_converte_foto_para_webp_preservando_transparencia(self) -> None:
        processada = processar_foto(criar_png(transparente=True))

        with Image.open(BytesIO(processada)) as imagem:
            self.assertEqual(imagem.format, "WEBP")
            self.assertIn("A", imagem.getbands())

    def test_recusa_arquivo_que_nao_e_imagem(self) -> None:
        with self.assertRaises(FotoCasoInvalidaError):
            processar_foto(b"not an image")


class PersistenciaFotoCasoTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine, autoflush=False)()
        cliente = Cliente(nome="Cliente da foto", ativo=True)
        self.session.add(cliente)
        self.session.commit()
        self.session.refresh(cliente)
        self.caso = Caso(
            cliente_id=cliente.id,
            titulo="Caso da foto",
            tipo_atendimento="Cível",
        )
        self.session.add(self.caso)
        self.session.commit()
        self.session.refresh(self.caso)

    def tearDown(self) -> None:
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_salva_torna_disponivel_e_remove_a_foto(self) -> None:
        enviados = []
        with patch(
            "app.services.foto_caso_service.enviar_arquivo",
            side_effect=lambda arquivo, chave, tipo: enviados.append((chave, tipo)),
        ), patch(
            "app.services.foto_caso_service.gerar_url_download",
            return_value="https://storage.exemplo/foto-assinada",
        ), patch("app.services.foto_caso_service.remover_arquivo_storage"):
            salvo = salvar_foto_caso(
                self.session,
                self.caso.id,
                UploadFile(file=BytesIO(criar_png()), filename="foto.png"),
            )
            self.assertTrue(salvo.tem_foto)
            self.assertTrue(enviados[0][0].startswith(f"casos/{self.caso.id}/foto/"))
            self.assertEqual(enviados[0][1], "image/webp")
            self.assertTrue(CasoResponse.model_validate(salvo).tem_foto)
            self.assertEqual(
                gerar_link_foto_caso(self.session, self.caso.id)["url"],
                "https://storage.exemplo/foto-assinada",
            )

            removido = remover_foto_caso(self.session, self.caso.id)
            self.assertFalse(removido.tem_foto)
            self.assertFalse(CasoResponse.model_validate(removido).tem_foto)


if __name__ == "__main__":
    unittest.main()
