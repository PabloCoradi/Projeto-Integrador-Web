"""Testes do upload e do acesso protegido às fotos das pastas de casos."""

from io import BytesIO
from unittest.mock import patch

from PIL import Image

from tests.banco_memoria import TesteComBancoEmMemoria


class FotosCasosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()

        self.envios = []
        envio = patch(
            "app.services.foto_caso_service.enviar_arquivo",
            side_effect=lambda arquivo, chave, content_type: self.envios.append(chave),
        )
        link = patch(
            "app.services.foto_caso_service.gerar_url_download",
            return_value="https://storage.exemplo/foto-assinada",
        )
        remover = patch("app.services.foto_caso_service.remover_arquivo_storage")
        envio.start()
        link.start()
        remover.start()
        self.addCleanup(envio.stop)
        self.addCleanup(link.stop)
        self.addCleanup(remover.stop)

        admin = self.criar_usuario(email="admin-fotos@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)
        cliente_id = self.client.post(
            "/api/clientes/", json={"nome": "Maria da Silva"}, headers=self.headers
        ).json()["id"]
        self.cliente_id = cliente_id
        self.caso_id = self.client.post(
            "/api/casos/",
            json={
                "cliente_id": cliente_id,
                "titulo": "Ação trabalhista",
                "tipo_atendimento": "Trabalhista",
            },
            headers=self.headers,
        ).json()["id"]

    @staticmethod
    def foto_png() -> bytes:
        buffer = BytesIO()
        Image.new("RGB", (32, 24), "teal").save(buffer, format="PNG")
        return buffer.getvalue()

    def enviar_foto(self, conteudo=None):
        return self.client.post(
            f"/api/casos/{self.caso_id}/foto",
            files={"arquivo": ("retrato.png", conteudo or self.foto_png(), "image/png")},
            headers=self.headers,
        )

    def test_envia_foto_convertida_e_exibe_indicador_no_caso(self) -> None:
        resposta = self.enviar_foto()

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertTrue(resposta.json()["tem_foto"])
        self.assertEqual(len(self.envios), 1)
        self.assertTrue(self.envios[0].startswith(f"casos/{self.caso_id}/foto/"))
        listagem = self.client.get("/api/casos/", headers=self.headers).json()
        self.assertTrue(listagem[0]["tem_foto"])

    def test_link_da_foto_exige_permissao_para_visualizar_casos(self) -> None:
        self.enviar_foto()
        link = self.client.get(
            f"/api/casos/{self.caso_id}/foto/link", headers=self.headers
        )

        self.assertEqual(link.status_code, 200, link.text)
        self.assertEqual(link.json()["url"], "https://storage.exemplo/foto-assinada")

        leitor = self.criar_usuario(email="leitor-fotos@exemplo.com")
        self.dar_permissao(leitor, "casos", pode_visualizar=True)
        link_leitor = self.client.get(
            f"/api/casos/{self.caso_id}/foto/link",
            headers=self.cabecalho_auth(leitor),
        )
        self.assertEqual(link_leitor.status_code, 200, link_leitor.text)

    def dar_foto_ao_cliente(self, chave: str = "clientes/1/foto/retrato.webp") -> None:
        from app.models.cliente import Cliente

        cliente = self.session.get(Cliente, self.cliente_id)
        cliente.foto_chave_storage = chave
        self.session.commit()

    def test_pasta_sem_foto_usa_a_foto_do_cliente(self) -> None:
        self.dar_foto_ao_cliente("clientes/1/foto/retrato.webp")

        caso = self.client.get(f"/api/casos/{self.caso_id}", headers=self.headers).json()
        self.assertFalse(caso["tem_foto"])
        self.assertTrue(caso["cliente_tem_foto"])

        with patch(
            "app.services.foto_caso_service.gerar_url_download",
            return_value="https://storage.exemplo/foto-cliente",
        ) as gerar:
            link = self.client.get(
                f"/api/casos/{self.caso_id}/foto/link", headers=self.headers
            )

        self.assertEqual(link.status_code, 200, link.text)
        self.assertEqual(gerar.call_args.kwargs["chave"], "clientes/1/foto/retrato.webp")

    def test_foto_propria_da_pasta_tem_prioridade_sobre_a_do_cliente(self) -> None:
        self.dar_foto_ao_cliente()
        self.enviar_foto()

        with patch(
            "app.services.foto_caso_service.gerar_url_download",
            return_value="https://storage.exemplo/foto-caso",
        ) as gerar:
            self.client.get(f"/api/casos/{self.caso_id}/foto/link", headers=self.headers)

        self.assertTrue(gerar.call_args.kwargs["chave"].startswith(f"casos/{self.caso_id}/foto/"))

    def test_sem_foto_na_pasta_nem_no_cliente_o_link_nao_existe(self) -> None:
        link = self.client.get(f"/api/casos/{self.caso_id}/foto/link", headers=self.headers)
        self.assertEqual(link.status_code, 404)

    def test_recusa_arquivo_que_nao_e_imagem(self) -> None:
        resposta = self.enviar_foto(b"not an image")
        self.assertEqual(resposta.status_code, 400)

    def test_remove_foto_da_pasta(self) -> None:
        self.enviar_foto()
        resposta = self.client.delete(
            f"/api/casos/{self.caso_id}/foto", headers=self.headers
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertFalse(resposta.json()["tem_foto"])
