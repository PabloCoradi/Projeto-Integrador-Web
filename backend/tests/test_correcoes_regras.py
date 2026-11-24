"""
TESTE — Correções de regras

- CPF/CNPJ igual com ou sem pontuação é o mesmo documento.
- Filtros de casos ignoram acentos e maiúsculas.
- Caso de cliente inativo conta como inativo (lista, Dashboard e arquivos)
  e volta sozinho quando o cliente é reativado.
- Inativar cliente/caso que já está inativo (ou reativar o que já está ativo) avisa.
"""

from tests.banco_memoria import TesteComBancoEmMemoria


class CorrecoesTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        self.admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(self.admin)

    def cliente(self, nome: str, **dados):
        return self.client.post(
            "/api/clientes/", json={"nome": nome, **dados}, headers=self.headers
        )

    def caso(self, cliente_id: int, titulo: str, tipo: str = "Cível", obs: str | None = None) -> int:
        resposta = self.client.post(
            "/api/casos/",
            json={"cliente_id": cliente_id, "titulo": titulo, "tipo_atendimento": tipo, "observacoes": obs},
            headers=self.headers,
        )
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()["id"]

    def titulos(self, **params) -> list[str]:
        resposta = self.client.get("/api/casos/", params=params, headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return sorted(c["titulo"] for c in resposta.json())

    # ------------------------------------------------------------ CPF/CNPJ
    def test_mesmo_cpf_com_e_sem_pontuacao_e_bloqueado(self) -> None:
        self.assertEqual(self.cliente("Ana", cpf_cnpj="12345678900").status_code, 201)

        resposta = self.cliente("Ana de novo", cpf_cnpj="123.456.789-00")

        self.assertEqual(resposta.status_code, 409)

    def test_mesmo_cnpj_com_e_sem_pontuacao_e_bloqueado(self) -> None:
        self.assertEqual(self.cliente("Empresa", cpf_cnpj="12.345.678/0001-90").status_code, 201)
        self.assertEqual(self.cliente("Empresa 2", cpf_cnpj="12345678000190").status_code, 409)

    def test_editar_para_cpf_de_outro_cliente_e_bloqueado(self) -> None:
        self.cliente("Ana", cpf_cnpj="111.222.333-44")
        bruno = self.cliente("Bruno").json()["id"]

        resposta = self.client.put(
            f"/api/clientes/{bruno}", json={"cpf_cnpj": "11122233344"}, headers=self.headers
        )

        self.assertEqual(resposta.status_code, 409)

    def test_cliente_pode_reformatar_o_proprio_cpf(self) -> None:
        ana = self.cliente("Ana", cpf_cnpj="11122233344").json()["id"]

        resposta = self.client.put(
            f"/api/clientes/{ana}", json={"cpf_cnpj": "111.222.333-44"}, headers=self.headers
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)

    # ------------------------------------------------------------ filtros sem acento
    def test_filtro_de_tipo_ignora_acentos_e_maiusculas(self) -> None:
        cliente_id = self.cliente("Ana").json()["id"]
        self.caso(cliente_id, "Cobrança", tipo="Cível")
        self.caso(cliente_id, "Inventário", tipo="Família e Sucessões")

        for busca in ("civel", "CÍVEL", "Cível", "  cIvEl "):
            self.assertEqual(self.titulos(tipo_atendimento=busca), ["Cobrança"], busca)

        self.assertEqual(self.titulos(tipo_atendimento="familia"), ["Inventário"])

    def test_busca_por_texto_ignora_acentos_e_maiusculas(self) -> None:
        cliente_id = self.cliente("Ana").json()["id"]
        self.caso(cliente_id, "Ação de cobrança", obs="Audiência marcada")
        self.caso(cliente_id, "Outro assunto")

        self.assertEqual(self.titulos(q="acao"), ["Ação de cobrança"])
        self.assertEqual(self.titulos(q="COBRANCA"), ["Ação de cobrança"])
        self.assertEqual(self.titulos(q="audiencia"), ["Ação de cobrança"])

    # ------------------------------------------------------------ casos de cliente inativo
    def test_casos_de_cliente_inativo_vao_para_inativos_e_voltam(self) -> None:
        ana = self.cliente("Ana").json()["id"]
        self.caso(ana, "Caso da Ana")
        bruno = self.cliente("Bruno").json()["id"]
        self.caso(bruno, "Caso do Bruno")

        self.client.delete(f"/api/clientes/{ana}", headers=self.headers)

        self.assertEqual(self.titulos(), ["Caso do Bruno"])
        inativos = self.client.get(
            "/api/casos/", params={"situacao": "inativos"}, headers=self.headers
        ).json()
        self.assertEqual([c["titulo"] for c in inativos], ["Caso da Ana"])
        self.assertTrue(inativos[0]["ativo"])
        self.assertFalse(inativos[0]["cliente_ativo"])

        self.client.patch(f"/api/clientes/{ana}/reativar", headers=self.headers)

        self.assertEqual(self.titulos(), ["Caso da Ana", "Caso do Bruno"])

    def test_caso_de_cliente_inativo_e_so_consulta(self) -> None:
        ana = self.cliente("Ana").json()["id"]
        caso_id = self.caso(ana, "Caso da Ana")
        self.client.delete(f"/api/clientes/{ana}", headers=self.headers)

        self.assertEqual(
            self.client.get(f"/api/casos/{caso_id}/arquivos/", headers=self.headers).status_code,
            200,
        )
        envio = self.client.post(
            f"/api/casos/{caso_id}/arquivos/",
            files={"arquivo": ("a.pdf", b"%PDF", "application/pdf")},
            headers=self.headers,
        )
        self.assertEqual(envio.status_code, 409)
        self.assertIn("cliente", envio.json()["detail"])
        self.assertEqual(
            self.client.put(
                f"/api/casos/{caso_id}", json={"titulo": "Novo título"}, headers=self.headers
            ).status_code,
            404,
        )

        reativar = self.client.patch(f"/api/casos/{caso_id}/reativar", headers=self.headers)
        self.assertEqual(reativar.status_code, 409)
        self.assertIn("Reative o cliente", reativar.json()["detail"])

    def test_dashboard_nao_conta_casos_de_cliente_inativo(self) -> None:
        ana = self.cliente("Ana").json()["id"]
        self.caso(ana, "Caso da Ana", tipo="Cível")
        bruno = self.cliente("Bruno").json()["id"]
        self.caso(bruno, "Caso do Bruno", tipo="Família")
        self.client.delete(f"/api/clientes/{ana}", headers=self.headers)

        resumo = self.client.get("/api/dashboard/", headers=self.headers).json()

        self.assertEqual(resumo["casos"]["ativos"], 1)
        self.assertEqual(resumo["casos"]["por_tipo"], [{"tipo": "Família", "total": 1}])
        self.assertNotIn("Caso da Ana", [a["titulo"] for a in resumo["atividades"]])

    def test_dashboard_junta_grafias_do_mesmo_tipo(self) -> None:
        cliente_id = self.cliente("Ana").json()["id"]
        self.caso(cliente_id, "Um", tipo="Cível")
        self.caso(cliente_id, "Dois", tipo="Cível")
        self.caso(cliente_id, "Três", tipo="civel")
        self.caso(cliente_id, "Quatro", tipo="Família")

        por_tipo = self.client.get("/api/dashboard/", headers=self.headers).json()["casos"]["por_tipo"]

        self.assertEqual(
            por_tipo,
            [{"tipo": "Cível", "total": 3}, {"tipo": "Família", "total": 1}],
        )

    # ------------------------------------------------------------ inativar/reativar repetido
    def test_cliente_inativar_ou_reativar_repetido_avisa(self) -> None:
        ana = self.cliente("Ana").json()["id"]

        reativar = self.client.patch(f"/api/clientes/{ana}/reativar", headers=self.headers)
        self.assertEqual(reativar.status_code, 409)
        self.assertIn("já está ativo", reativar.json()["detail"])

        self.assertEqual(self.client.delete(f"/api/clientes/{ana}", headers=self.headers).status_code, 200)
        de_novo = self.client.delete(f"/api/clientes/{ana}", headers=self.headers)
        self.assertEqual(de_novo.status_code, 409)
        self.assertIn("já está inativo", de_novo.json()["detail"])

    def test_caso_inativar_ou_reativar_repetido_avisa(self) -> None:
        caso_id = self.caso(self.cliente("Ana").json()["id"], "Caso")

        self.assertEqual(
            self.client.patch(f"/api/casos/{caso_id}/reativar", headers=self.headers).status_code, 409
        )
        self.assertEqual(self.client.delete(f"/api/casos/{caso_id}", headers=self.headers).status_code, 200)
        self.assertEqual(self.client.delete(f"/api/casos/{caso_id}", headers=self.headers).status_code, 409)

    def test_inexistentes_continuam_404(self) -> None:
        self.assertEqual(self.client.delete("/api/clientes/999", headers=self.headers).status_code, 404)
        self.assertEqual(self.client.delete("/api/casos/999", headers=self.headers).status_code, 404)
        self.assertEqual(self.client.patch("/api/casos/999/reativar", headers=self.headers).status_code, 404)
