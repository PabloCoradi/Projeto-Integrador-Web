"""
TESTE 6 — Arquivos dos casos com tag (PETIÇÃO, CONTRATO, SENTENÇA...)

Verifica o envio com tag, a tag padrão OUTROS quando nada é informado, o
filtro por tag e a troca de tag.

O RustFS é substituído por dublês: nenhum arquivo sai da máquina.
"""

from unittest.mock import patch

from tests.banco_memoria import TesteComBancoEmMemoria


class ArquivosCasosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()

        self.envios = []
        envio = patch(
            "app.services.arquivo_service.enviar_arquivo",
            side_effect=lambda arquivo, chave, content_type: self.envios.append(chave),
        )
        envio.start()
        self.addCleanup(envio.stop)

        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)

        cliente_id = self.client.post(
            "/api/clientes/", json={"nome": "Maria da Silva"}, headers=self.headers
        ).json()["id"]
        self.caso_id = self.client.post(
            "/api/casos/",
            json={
                "cliente_id": cliente_id,
                "titulo": "Ação trabalhista",
                "tipo_atendimento": "Trabalhista",
            },
            headers=self.headers,
        ).json()["id"]
        self.base = f"/api/casos/{self.caso_id}/arquivos/"

    def enviar(self, tag=None, nome="peticao.pdf"):
        dados = {} if tag is None else {"tag": tag}
        return self.client.post(
            self.base,
            files={"arquivo": (nome, b"%PDF-1.4", "application/pdf")},
            data=dados,
            headers=self.headers,
        )

    def test_envia_com_tag_padronizada_na_pasta_casos(self) -> None:
        resposta = self.enviar(tag="  petição inicial ")

        self.assertEqual(resposta.status_code, 201, resposta.text)
        self.assertEqual(resposta.json()["tag"], "PETIÇÃO INICIAL")
        self.assertTrue(self.envios[0].startswith(f"casos/{self.caso_id}/"))

    def test_sem_tag_o_arquivo_recebe_a_tag_padrao(self) -> None:
        self.assertEqual(self.enviar().json()["tag"], "OUTROS")
        self.assertEqual(self.enviar(tag="   ").json()["tag"], "OUTROS")

    def test_filtra_por_tag_e_troca_tag(self) -> None:
        arquivo_id = self.enviar(tag="CONTRATO", nome="contrato.pdf").json()["id"]
        self.enviar(tag="SENTENÇA", nome="sentenca.pdf")

        so_contrato = self.client.get(
            self.base, params={"tag": "contrato"}, headers=self.headers
        ).json()
        self.assertEqual([a["nome_original"] for a in so_contrato], ["contrato.pdf"])

        resposta = self.client.patch(
            f"{self.base}{arquivo_id}", json={"tag": "prova"}, headers=self.headers
        )
        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(resposta.json()["tag"], "PROVA")

    def test_usuario_so_com_visualizacao_nao_troca_tag(self) -> None:
        arquivo_id = self.enviar(tag="CONTRATO").json()["id"]

        leitor = self.criar_usuario(email="leitor@exemplo.com")
        self.dar_permissao(leitor, "casos", pode_visualizar=True)

        resposta = self.client.patch(
            f"{self.base}{arquivo_id}",
            json={"tag": "PROVA"},
            headers=self.cabecalho_auth(leitor),
        )
        self.assertEqual(resposta.status_code, 403)
