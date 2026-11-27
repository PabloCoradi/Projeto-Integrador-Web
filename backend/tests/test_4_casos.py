"""
TESTE 4 — Casos vinculados a clientes

Verifica que um caso só pode ser aberto para um cliente existente e ativo,
a busca com filtros, a edição parcial e a inativação.
"""

from tests.banco_memoria import TesteComBancoEmMemoria


class CasosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)

        resposta = self.client.post(
            "/api/clientes/", json={"nome": "Maria da Silva"}, headers=self.headers
        )
        self.assertEqual(resposta.status_code, 201, resposta.text)
        self.cliente_id = resposta.json()["id"]

    def abrir_caso(self, **dados):
        corpo = {
            "cliente_id": self.cliente_id,
            "titulo": "Ação trabalhista",
            "tipo_atendimento": "Trabalhista",
        }
        corpo.update(dados)
        return self.client.post("/api/casos/", json=corpo, headers=self.headers)

    def test_nao_abre_caso_para_cliente_inexistente_ou_inativo(self) -> None:
        self.assertEqual(self.abrir_caso(cliente_id=99999).status_code, 404)

        self.client.delete(f"/api/clientes/{self.cliente_id}", headers=self.headers)
        self.assertEqual(self.abrir_caso().status_code, 404)

    def test_abrir_caso_e_filtrar_na_listagem(self) -> None:
        self.assertEqual(
            self.abrir_caso(titulo="Ação trabalhista", observacoes="horas extras").status_code,
            201,
        )
        self.abrir_caso(titulo="Pensão alimentícia", tipo_atendimento="Família")

        por_tipo = self.client.get(
            "/api/casos/", params={"tipo_atendimento": "Família"}, headers=self.headers
        ).json()
        por_texto = self.client.get(
            "/api/casos/", params={"q": "horas"}, headers=self.headers
        ).json()

        self.assertEqual([c["titulo"] for c in por_tipo], ["Pensão alimentícia"])
        self.assertEqual([c["titulo"] for c in por_texto], ["Ação trabalhista"])

    def test_busca_por_texto_encontra_pelo_nome_do_cliente(self) -> None:
        outro_id = self.client.post(
            "/api/clientes/", json={"nome": "João Pereira"}, headers=self.headers
        ).json()["id"]
        self.abrir_caso(titulo="Ação trabalhista")
        self.abrir_caso(cliente_id=outro_id, titulo="Inventário", tipo_atendimento="Família")

        por_nome = self.client.get(
            "/api/casos/", params={"q": "joao"}, headers=self.headers
        ).json()
        por_sobrenome = self.client.get(
            "/api/casos/", params={"q": "SILVA"}, headers=self.headers
        ).json()
        por_tipo = self.client.get(
            "/api/casos/", params={"q": "familia"}, headers=self.headers
        ).json()

        self.assertEqual([c["titulo"] for c in por_nome], ["Inventário"])
        self.assertEqual([c["titulo"] for c in por_sobrenome], ["Ação trabalhista"])
        self.assertEqual([c["titulo"] for c in por_tipo], ["Inventário"])

    def test_edicao_parcial_altera_so_o_que_foi_enviado(self) -> None:
        caso = self.abrir_caso().json()

        resposta = self.client.put(
            f"/api/casos/{caso['id']}",
            # titulo = null não pode apagar o título (é campo obrigatório)
            json={"observacoes": "Audiência marcada", "titulo": None},
            headers=self.headers,
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        atualizado = resposta.json()
        self.assertEqual(atualizado["observacoes"], "Audiência marcada")
        self.assertEqual(atualizado["titulo"], "Ação trabalhista")
        self.assertEqual(atualizado["tipo_atendimento"], "Trabalhista")

    def test_caso_inativado_nao_aparece_mais(self) -> None:
        caso_id = self.abrir_caso().json()["id"]

        self.assertEqual(
            self.client.delete(f"/api/casos/{caso_id}", headers=self.headers).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(f"/api/casos/{caso_id}", headers=self.headers).status_code,
            404,
        )
        self.assertEqual(self.client.get("/api/casos/", headers=self.headers).json(), [])

    def test_caso_inativo_abre_pelo_link_direto_so_quando_pedido(self) -> None:
        caso_id = self.abrir_caso().json()["id"]
        self.client.delete(f"/api/casos/{caso_id}", headers=self.headers)

        resposta = self.client.get(
            f"/api/casos/{caso_id}",
            params={"incluir_inativos": "true"},
            headers=self.headers,
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertFalse(resposta.json()["ativo"])

    def test_lista_os_casos_de_um_cliente(self) -> None:
        outro_id = self.client.post(
            "/api/clientes/", json={"nome": "João Pereira"}, headers=self.headers
        ).json()["id"]
        self.abrir_caso(titulo="Ação trabalhista")
        self.abrir_caso(cliente_id=outro_id, titulo="Inventário")

        casos = self.client.get(
            "/api/casos/", params={"cliente_id": self.cliente_id}, headers=self.headers
        ).json()

        self.assertEqual([c["titulo"] for c in casos], ["Ação trabalhista"])
