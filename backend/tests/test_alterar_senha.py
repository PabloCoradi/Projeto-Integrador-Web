"""
TESTE — Senhas

A única forma de um usuário trocar a própria senha é estando logado e
informando a senha atual ("Alterar minha senha"). Esquecimento de senha é
resolvido pelo administrador, na tela Administradores. Não existe rota
pública de redefinição de senha.
"""

from tests.banco_memoria import TesteComBancoEmMemoria

PROVISORIA = "Provisoria123"
NOVA = "MinhaSenha123"


class AlterarSenhaTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        self.admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.funcionario = self.criar_usuario(email="func@exemplo.com", senha=PROVISORIA)
        self.headers = self.cabecalho_auth(self.funcionario)

    def alterar(self, senha_atual, nova, confirmar=None, headers=None):
        return self.client.post(
            "/api/auth/alterar-minha-senha",
            json={
                "senha_atual": senha_atual,
                "nova_senha": nova,
                "confirmar_senha": nova if confirmar is None else confirmar,
            },
            headers=self.headers if headers is None else headers,
        )

    def login(self, senha):
        return self.client.post(
            "/api/auth/login", json={"email": "func@exemplo.com", "senha": senha}
        )

    def test_rota_publica_de_redefinicao_nao_existe(self) -> None:
        resposta = self.client.post(
            "/api/auth/redefinir-senha",
            json={"email": "func@exemplo.com", "nova_senha": NOVA, "confirmar_senha": NOVA},
        )

        self.assertIn(resposta.status_code, (404, 405))
        self.assertEqual(self.login(NOVA).status_code, 401)
        self.assertEqual(self.login(PROVISORIA).status_code, 200)

    def test_usuario_logado_troca_a_propria_senha(self) -> None:
        resposta = self.alterar(PROVISORIA, NOVA)

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(self.login(PROVISORIA).status_code, 401)
        self.assertEqual(self.login(NOVA).status_code, 200)

    def test_exige_a_senha_atual_correta(self) -> None:
        resposta = self.alterar("SenhaErrada99", NOVA)

        self.assertEqual(resposta.status_code, 400)
        self.assertIn("senha atual", resposta.json()["detail"].lower())
        self.assertEqual(self.login(PROVISORIA).status_code, 200)

    def test_exige_confirmacao_igual(self) -> None:
        resposta = self.alterar(PROVISORIA, NOVA, confirmar="OutraSenha123")

        self.assertEqual(resposta.status_code, 400)
        self.assertEqual(self.login(PROVISORIA).status_code, 200)

    def test_nova_senha_deve_ser_diferente(self) -> None:
        self.assertEqual(self.alterar(PROVISORIA, PROVISORIA).status_code, 400)

    def test_nova_senha_precisa_de_8_caracteres(self) -> None:
        self.assertEqual(self.alterar(PROVISORIA, "curta").status_code, 422)

    def test_sem_login_nao_altera(self) -> None:
        resposta = self.alterar(PROVISORIA, NOVA, headers={})

        self.assertIn(resposta.status_code, (401, 403))
        self.assertEqual(self.login(PROVISORIA).status_code, 200)

    def test_administrador_define_nova_senha_para_quem_esqueceu(self) -> None:
        resposta = self.client.put(
            f"/api/administradores/{self.funcionario.id}",
            json={"senha": "DefinidaPelaDona1"},
            headers=self.cabecalho_auth(self.admin),
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertEqual(self.login("DefinidaPelaDona1").status_code, 200)
