"""
TESTE 5 — Documentos dos clientes (CNH, IDENTIDADE, CPF...)

Verifica o envio com tag, a pasta clientes/ no armazenamento, o filtro por
tag, a troca de tag, a remoção, as permissões e que os casos enxergam
automaticamente os documentos do cliente vinculado.

O RustFS é substituído por dublês: nenhum arquivo sai da máquina.
"""

from unittest.mock import patch

from tests.banco_memoria import TesteComBancoEmMemoria


class DocumentosClientesTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()

        self.envios = []
        envio = patch(
            "app.services.documento_cliente_service.enviar_arquivo",
            side_effect=lambda arquivo, chave, content_type: self.envios.append(chave),
        )
        link = patch(
            "app.services.arquivo_service.gerar_url_download",
            side_effect=lambda chave, nome_original, inline=False: f"http://storage/{chave}",
        )
        envio.start()
        link.start()
        self.addCleanup(envio.stop)
        self.addCleanup(link.stop)

        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)

        self.cliente_id = self.client.post(
            "/api/clientes/", json={"nome": "Maria da Silva"}, headers=self.headers
        ).json()["id"]

    def enviar(self, tag="CNH", nome="cnh.pdf", conteudo=b"%PDF-1.4", cliente_id=None, headers=None):
        return self.client.post(
            f"/api/clientes/{cliente_id or self.cliente_id}/documentos/",
            files={"arquivo": (nome, conteudo, "application/pdf")},
            data={"tag": tag},
            headers=headers or self.headers,
        )

    def test_envia_documento_com_tag_padronizada_na_pasta_clientes(self) -> None:
        resposta = self.enviar(tag="  identidade  ")

        self.assertEqual(resposta.status_code, 201, resposta.text)
        documento = resposta.json()
        self.assertEqual(documento["tag"], "IDENTIDADE")
        self.assertEqual(documento["nome_original"], "cnh.pdf")
        self.assertEqual(len(self.envios), 1)
        self.assertTrue(self.envios[0].startswith(f"clientes/{self.cliente_id}/"))

    def test_sem_tag_o_documento_recebe_a_tag_padrao(self) -> None:
        com_espacos = self.enviar(tag="   ")
        sem_campo = self.client.post(
            f"/api/clientes/{self.cliente_id}/documentos/",
            files={"arquivo": ("foto.jpg", b"jpg", "image/jpeg")},
            headers=self.headers,
        )

        self.assertEqual(com_espacos.status_code, 201, com_espacos.text)
        self.assertEqual(sem_campo.status_code, 201, sem_campo.text)
        self.assertEqual(com_espacos.json()["tag"], "OUTROS")
        self.assertEqual(sem_campo.json()["tag"], "OUTROS")

    def test_recusa_arquivo_vazio_e_cliente_inexistente(self) -> None:
        self.assertEqual(self.enviar(conteudo=b"").status_code, 400)
        self.assertEqual(self.enviar(cliente_id=99999).status_code, 404)
        self.assertEqual(self.envios, [])

    def test_lista_filtra_por_tag_e_sugere_tags_usadas(self) -> None:
        self.enviar(tag="CNH")
        self.enviar(tag="cpf", nome="cpf.pdf")

        todos = self.client.get(
            f"/api/clientes/{self.cliente_id}/documentos/", headers=self.headers
        ).json()
        so_cpf = self.client.get(
            f"/api/clientes/{self.cliente_id}/documentos/",
            params={"tag": "Cpf"},
            headers=self.headers,
        ).json()
        tags = self.client.get("/api/clientes/documentos/tags", headers=self.headers).json()

        self.assertEqual(len(todos), 2)
        self.assertEqual([d["nome_original"] for d in so_cpf], ["cpf.pdf"])
        self.assertEqual(tags, ["CNH", "CPF"])

    def test_troca_tag_gera_link_e_remove(self) -> None:
        documento_id = self.enviar(tag="OUTROS").json()["id"]
        base = f"/api/clientes/{self.cliente_id}/documentos/{documento_id}"

        resposta = self.client.patch(base, json={"tag": "cnh"}, headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(resposta.json()["tag"], "CNH")

        link = self.client.get(f"{base}/link", headers=self.headers)
        self.assertEqual(link.status_code, 200, link.text)
        self.assertIn(f"clientes/{self.cliente_id}/", link.json()["url"])

        self.assertEqual(self.client.delete(base, headers=self.headers).status_code, 200)
        self.assertEqual(self.client.get(f"{base}/link", headers=self.headers).status_code, 404)

    def test_documento_de_outro_cliente_nao_e_acessivel(self) -> None:
        outro_id = self.client.post(
            "/api/clientes/", json={"nome": "João"}, headers=self.headers
        ).json()["id"]
        documento_id = self.enviar().json()["id"]

        resposta = self.client.get(
            f"/api/clientes/{outro_id}/documentos/{documento_id}/link",
            headers=self.headers,
        )
        self.assertEqual(resposta.status_code, 404)

    def test_usuario_so_com_visualizacao_nao_envia(self) -> None:
        leitor = self.criar_usuario(email="leitor@exemplo.com")
        self.dar_permissao(leitor, "clientes", pode_visualizar=True)
        headers = self.cabecalho_auth(leitor)

        self.assertEqual(self.enviar(headers=headers).status_code, 403)
        self.assertEqual(
            self.client.get(
                f"/api/clientes/{self.cliente_id}/documentos/", headers=headers
            ).status_code,
            200,
        )

    def test_caso_puxa_documentos_do_cliente_automaticamente(self) -> None:
        self.enviar(tag="CNH")

        caso_id = self.client.post(
            "/api/casos/",
            json={
                "cliente_id": self.cliente_id,
                "titulo": "Ação trabalhista",
                "tipo_atendimento": "Trabalhista",
            },
            headers=self.headers,
        ).json()["id"]

        # Documento enviado depois de o caso existir também aparece
        self.enviar(tag="IDENTIDADE", nome="rg.pdf")

        documentos = self.client.get(
            f"/api/casos/{caso_id}/documentos-cliente/", headers=self.headers
        ).json()
        self.assertEqual(sorted(d["tag"] for d in documentos), ["CNH", "IDENTIDADE"])

        # Quem só tem acesso a casos consegue abrir os documentos pelo caso
        advogado = self.criar_usuario(email="advogado@exemplo.com")
        self.dar_permissao(advogado, "casos", pode_visualizar=True)
        headers = self.cabecalho_auth(advogado)

        link = self.client.get(
            f"/api/casos/{caso_id}/documentos-cliente/{documentos[0]['id']}/link",
            headers=headers,
        )
        self.assertEqual(link.status_code, 200, link.text)
        self.assertEqual(
            self.client.get(
                f"/api/clientes/{self.cliente_id}/documentos/", headers=headers
            ).status_code,
            403,
        )
