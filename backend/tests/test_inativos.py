"""
TESTE — Consultar e reativar clientes e casos inativos

Registros inativados somem da listagem padrão, mas continuam acessíveis
pelo filtro situacao=inativos e podem ser reativados.
"""

from tests.banco_memoria import TesteComBancoEmMemoria


class InativosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)

    def criar_cliente(self, nome: str, **dados) -> int:
        resposta = self.client.post(
            "/api/clientes/", json={"nome": nome, **dados}, headers=self.headers
        )
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()["id"]

    def criar_caso(self, cliente_id: int, titulo: str) -> int:
        resposta = self.client.post(
            "/api/casos/",
            json={"cliente_id": cliente_id, "titulo": titulo, "tipo_atendimento": "Cível"},
            headers=self.headers,
        )
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()["id"]

    def nomes(self, url: str, situacao: str | None = None, campo: str = "nome") -> list[str]:
        params = {"situacao": situacao} if situacao else {}
        resposta = self.client.get(url, params=params, headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return [item[campo] for item in resposta.json()]

    def test_cliente_inativo_aparece_no_filtro_e_pode_ser_reativado(self) -> None:
        self.criar_cliente("Ativo")
        inativo_id = self.criar_cliente("Inativo", cpf_cnpj="123.456.789-00")
        self.client.delete(f"/api/clientes/{inativo_id}", headers=self.headers)

        self.assertEqual(self.nomes("/api/clientes/"), ["Ativo"])
        self.assertEqual(self.nomes("/api/clientes/", "inativos"), ["Inativo"])

        resposta = self.client.patch(
            f"/api/clientes/{inativo_id}/reativar", headers=self.headers
        )
        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertTrue(resposta.json()["ativo"])

        self.assertEqual(self.nomes("/api/clientes/"), ["Ativo", "Inativo"])
        self.assertEqual(self.nomes("/api/clientes/", "inativos"), [])

    def test_caso_inativo_aparece_no_filtro_e_pode_ser_reativado(self) -> None:
        cliente_id = self.criar_cliente("Maria")
        self.criar_caso(cliente_id, "Em andamento")
        encerrado_id = self.criar_caso(cliente_id, "Encerrado")
        self.client.delete(f"/api/casos/{encerrado_id}", headers=self.headers)

        self.assertEqual(self.nomes("/api/casos/", campo="titulo"), ["Em andamento"])

        inativos = self.client.get(
            "/api/casos/", params={"situacao": "inativos"}, headers=self.headers
        ).json()
        self.assertEqual([c["titulo"] for c in inativos], ["Encerrado"])
        self.assertEqual(inativos[0]["cliente_nome"], "Maria")

        resposta = self.client.patch(f"/api/casos/{encerrado_id}/reativar", headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(
            sorted(self.nomes("/api/casos/", campo="titulo")), ["Em andamento", "Encerrado"]
        )

    def test_nao_reativa_caso_de_cliente_inativo(self) -> None:
        cliente_id = self.criar_cliente("Maria")
        caso_id = self.criar_caso(cliente_id, "Encerrado")
        self.client.delete(f"/api/casos/{caso_id}", headers=self.headers)
        self.client.delete(f"/api/clientes/{cliente_id}", headers=self.headers)

        resposta = self.client.patch(f"/api/casos/{caso_id}/reativar", headers=self.headers)

        self.assertEqual(resposta.status_code, 409)
        self.assertIn("Reative o cliente", resposta.json()["detail"])

    def test_situacao_invalida_e_rejeitada(self) -> None:
        resposta = self.client.get(
            "/api/clientes/", params={"situacao": "todos"}, headers=self.headers
        )
        self.assertEqual(resposta.status_code, 422)

    def test_reativar_registro_inexistente_retorna_404(self) -> None:
        self.assertEqual(
            self.client.patch("/api/clientes/999/reativar", headers=self.headers).status_code,
            404,
        )
        self.assertEqual(
            self.client.patch("/api/casos/999/reativar", headers=self.headers).status_code,
            404,
        )

    def test_reativar_exige_permissao_de_edicao(self) -> None:
        cliente_id = self.criar_cliente("Maria")
        self.client.delete(f"/api/clientes/{cliente_id}", headers=self.headers)

        leitor = self.criar_usuario(email="leitor@exemplo.com")
        self.dar_permissao(leitor, "clientes", pode_visualizar=True)
        cabecalho = self.cabecalho_auth(leitor)

        lista = self.client.get(
            "/api/clientes/", params={"situacao": "inativos"}, headers=cabecalho
        )
        self.assertEqual(lista.status_code, 200)

        resposta = self.client.patch(f"/api/clientes/{cliente_id}/reativar", headers=cabecalho)
        self.assertEqual(resposta.status_code, 403)

    def test_cpf_de_cliente_inativo_indica_onde_reativar(self) -> None:
        cliente_id = self.criar_cliente("Maria", cpf_cnpj="111.222.333-44")
        self.client.delete(f"/api/clientes/{cliente_id}", headers=self.headers)

        resposta = self.client.post(
            "/api/clientes/",
            json={"nome": "Maria de novo", "cpf_cnpj": "111.222.333-44"},
            headers=self.headers,
        )

        self.assertEqual(resposta.status_code, 409)
        self.assertIn("inativo", resposta.json()["detail"])
        self.assertIn("Maria", resposta.json()["detail"])
