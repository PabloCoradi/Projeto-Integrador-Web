"""
TESTE 3 — Cadastro de clientes (CRUD)

Verifica cadastro, validação dos dados, bloqueio de CPF/CNPJ repetido e a
inativação (o cliente some da lista, mas não é apagado do banco).
"""

from app.models.cliente import Cliente
from tests.banco_memoria import TesteComBancoEmMemoria


class ClientesTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)

    def cadastrar(self, **dados):
        return self.client.post("/api/clientes/", json=dados, headers=self.headers)

    def test_cadastrar_cliente_limpa_espacos_e_padroniza_email(self) -> None:
        resposta = self.cadastrar(
            nome="  Maria da Silva  ",
            cpf_cnpj=" 123.456.789-00 ",
            email="Maria.Silva@Exemplo.com",
        )

        self.assertEqual(resposta.status_code, 201, resposta.text)
        cliente = resposta.json()
        self.assertEqual(cliente["nome"], "Maria da Silva")
        self.assertEqual(cliente["cpf_cnpj"], "123.456.789-00")
        self.assertEqual(cliente["email"], "maria.silva@exemplo.com")
        self.assertTrue(cliente["ativo"])

    def test_nao_permite_dois_clientes_com_mesmo_cpf(self) -> None:
        self.assertEqual(self.cadastrar(nome="Maria", cpf_cnpj="123.456.789-00").status_code, 201)

        repetido = self.cadastrar(nome="Outra Maria", cpf_cnpj="123.456.789-00")

        self.assertEqual(repetido.status_code, 409)
        self.assertIn("CPF/CNPJ", repetido.json()["detail"])

    def test_dados_invalidos_sao_rejeitados(self) -> None:
        casos_invalidos = (
            {"nome": "A"},                                   # nome curto demais
            {"nome": "   "},                                 # nome só com espaços
            {"nome": "Maria", "email": "isso-nao-e-email"},  # e-mail inválido
            {},                                              # sem nome
        )

        for dados in casos_invalidos:
            with self.subTest(dados=dados):
                self.assertEqual(self.cadastrar(**dados).status_code, 422)

    def test_inativar_cliente_tira_da_lista_mas_mantem_no_banco(self) -> None:
        cliente_id = self.cadastrar(nome="Maria").json()["id"]
        self.cadastrar(nome="João")

        resposta = self.client.delete(f"/api/clientes/{cliente_id}", headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)

        nomes = [c["nome"] for c in self.client.get("/api/clientes/", headers=self.headers).json()]
        self.assertEqual(nomes, ["João"])
        self.assertEqual(
            self.client.get(f"/api/clientes/{cliente_id}", headers=self.headers).status_code,
            404,
        )

        # Exclusão lógica: o registro continua no banco, só que inativo
        no_banco = self.session.get(Cliente, cliente_id)
        self.assertIsNotNone(no_banco)
        self.assertFalse(no_banco.ativo)
