"""
TESTE 2 — Controle de permissões por módulo

Cada usuário comum só acessa os módulos liberados para ele (visualizar ou
editar). O administrador acessa tudo. Usamos o módulo "clientes" como exemplo.
"""

from tests.banco_memoria import TesteComBancoEmMemoria


NOVO_CLIENTE = {"nome": "Cliente Teste"}


class PermissoesTest(TesteComBancoEmMemoria):
    def test_administrador_pode_ver_e_editar_sem_permissao_cadastrada(self) -> None:
        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        headers = self.cabecalho_auth(admin)

        self.assertEqual(self.client.get("/api/clientes/", headers=headers).status_code, 200)
        self.assertEqual(
            self.client.post("/api/clientes/", json=NOVO_CLIENTE, headers=headers).status_code,
            201,
        )

    def test_usuario_sem_permissao_recebe_403(self) -> None:
        usuario = self.criar_usuario()
        headers = self.cabecalho_auth(usuario)

        resposta = self.client.get("/api/clientes/", headers=headers)

        self.assertEqual(resposta.status_code, 403)

    def test_usuario_so_com_visualizar_nao_pode_cadastrar(self) -> None:
        usuario = self.criar_usuario()
        self.dar_permissao(usuario, "clientes", pode_visualizar=True)
        headers = self.cabecalho_auth(usuario)

        listar = self.client.get("/api/clientes/", headers=headers)
        cadastrar = self.client.post("/api/clientes/", json=NOVO_CLIENTE, headers=headers)

        self.assertEqual(listar.status_code, 200)
        self.assertEqual(cadastrar.status_code, 403)

    def test_permissao_de_um_modulo_nao_libera_outro(self) -> None:
        usuario = self.criar_usuario()
        self.dar_permissao(usuario, "clientes", pode_visualizar=True, pode_editar=True)
        headers = self.cabecalho_auth(usuario)

        self.assertEqual(
            self.client.post("/api/clientes/", json=NOVO_CLIENTE, headers=headers).status_code,
            201,
        )
        # Tem acesso a clientes, mas não a casos
        self.assertEqual(self.client.get("/api/casos/", headers=headers).status_code, 403)

    def test_requisicao_sem_token_e_bloqueada(self) -> None:
        resposta = self.client.get("/api/clientes/")

        self.assertEqual(resposta.status_code, 401)
