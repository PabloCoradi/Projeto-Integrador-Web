"""Testes do processamento e persistência das fotos de clientes."""

from io import BytesIO
import unittest
from unittest.mock import patch

from fastapi import UploadFile
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteResponse
from app.services.foto_cliente_service import (
    FotoClienteInvalidaError,
    gerar_link_foto_cliente,
    processar_foto_cliente,
    remover_foto_cliente,
    salvar_foto_cliente,
)


def criar_png() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (32, 24), "teal").save(buffer, format="PNG")
    return buffer.getvalue()


class ProcessamentoFotoClienteTest(unittest.TestCase):
    def test_converte_foto_para_webp(self) -> None:
        processada = processar_foto_cliente(criar_png())
        with Image.open(BytesIO(processada)) as imagem:
            self.assertEqual(imagem.format, "WEBP")

    def test_recusa_arquivo_que_nao_e_imagem(self) -> None:
        with self.assertRaises(FotoClienteInvalidaError):
            processar_foto_cliente(b"not an image")


class PersistenciaFotoClienteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine, autoflush=False)()
        self.cliente = Cliente(nome="Cliente da foto", ativo=True)
        self.session.add(self.cliente)
        self.session.commit()
        self.session.refresh(self.cliente)

    def tearDown(self) -> None:
        self.session.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_salva_gera_link_e_remove_foto(self) -> None:
        enviados = []
        with patch(
            "app.services.foto_cliente_service.enviar_arquivo",
            side_effect=lambda arquivo, chave, tipo: enviados.append((chave, tipo)),
        ), patch(
            "app.services.foto_cliente_service.gerar_url_download",
            return_value="https://storage.exemplo/foto-assinada",
        ), patch("app.services.foto_cliente_service.remover_arquivo_storage"):
            salvo = salvar_foto_cliente(
                self.session,
                self.cliente.id,
                UploadFile(file=BytesIO(criar_png()), filename="foto.png"),
            )
            self.assertTrue(salvo.tem_foto)
            self.assertTrue(enviados[0][0].startswith(f"clientes/{self.cliente.id}/foto/"))
            self.assertEqual(enviados[0][1], "image/webp")
            self.assertTrue(ClienteResponse.model_validate(salvo).tem_foto)
            self.assertEqual(
                gerar_link_foto_cliente(self.session, self.cliente.id)["url"],
                "https://storage.exemplo/foto-assinada",
            )

            removido = remover_foto_cliente(self.session, self.cliente.id)
            self.assertFalse(removido.tem_foto)
            self.assertFalse(ClienteResponse.model_validate(removido).tem_foto)

    def test_genera_link_de_foto_para_cliente_inativo_em_consulta(self) -> None:
        self.cliente.foto_chave_storage = f"clientes/{self.cliente.id}/foto/inativa.webp"
        self.cliente.ativo = False
        self.session.commit()

        with patch(
            "app.services.foto_cliente_service.gerar_url_download",
            return_value="https://storage.exemplo/foto-inativa",
        ):
            link = gerar_link_foto_cliente(self.session, self.cliente.id)

        self.assertEqual(link["url"], "https://storage.exemplo/foto-inativa")


if __name__ == "__main__":
    unittest.main()
