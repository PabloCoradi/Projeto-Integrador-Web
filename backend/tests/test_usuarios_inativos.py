"""
TESTE — Usuários desativados

Usuários desativados saem da lista padrão da tela Administradores, ficam
disponíveis no filtro situacao=inativos, podem ser reativados e não
conseguem entrar no sistema enquanto estiverem desativados.
"""

from tests.banco_memoria import TesteComBancoEmMemoria

SENHA = "SenhaForte123"


class UsuariosInativosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        self.admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(self.admin)

    def cadastrar(self, nome: str, email: str) -> int:
        resposta = self.client.post(
            "/api/administradores/",
            json={"nome": nome, "email": email, "senha": SENHA, "permissoes": []},
            headers=self.headers,
        )
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()["id"]

    def desativar(self, usuario_id: int) -> None:
        resposta = self.client.patch(
            f"/api/administradores/{usuario_id}/inativar", headers=self.headers
        )
        self.assertEqual(resposta.status_code, 200, resposta.text)

    def emails(self, situacao: str | None = None) -> list[str]:
        params = {"situacao": situacao} if situacao else {}
        resposta = self.client.get("/api/administradores/", params=params, headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return [u["email"] for u in resposta.json()]

    def login(self, email: str):
        return self.client.post("/api/auth/login", json={"email": email, "senha": SENHA})

    def test_desativado_sai_da_lista_e_aparece_no_filtro(self) -> None:
        self.cadastrar("Ana", "ana@exemplo.com")
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        self.desativar(bruno)

        self.assertEqual(sorted(self.emails()), ["admin@exemplo.com", "ana@exemplo.com"])
        self.assertEqual(self.emails("inativos"), ["bruno@exemplo.com"])

    def test_reativar_devolve_para_a_lista_de_ativos(self) -> None:
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        self.desativar(bruno)

        resposta = self.client.patch(
            f"/api/administradores/{bruno}/reativar", headers=self.headers
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertTrue(resposta.json()["ativo"])
        self.assertIn("bruno@exemplo.com", self.emails())
        self.assertEqual(self.emails("inativos"), [])

    def test_desativado_nao_faz_login_e_reativado_volta_a_entrar(self) -> None:
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        self.assertEqual(self.login("bruno@exemplo.com").status_code, 200)

        self.desativar(bruno)
        self.assertEqual(self.login("bruno@exemplo.com").status_code, 401)

        self.client.patch(f"/api/administradores/{bruno}/reativar", headers=self.headers)
        self.assertEqual(self.login("bruno@exemplo.com").status_code, 200)

    def test_quem_ja_estava_logado_perde_o_acesso_ao_ser_desativado(self) -> None:
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        token = self.login("bruno@exemplo.com").json()["access_token"]
        cabecalho = {"Authorization": f"Bearer {token}"}
        self.assertEqual(self.client.get("/api/auth/me", headers=cabecalho).status_code, 200)

        self.desativar(bruno)

        self.assertEqual(self.client.get("/api/auth/me", headers=cabecalho).status_code, 401)

    def test_desativado_nao_altera_a_propria_senha(self) -> None:
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        token = self.login("bruno@exemplo.com").json()["access_token"]
        self.desativar(bruno)

        resposta = self.client.post(
            "/api/auth/alterar-minha-senha",
            json={
                "senha_atual": SENHA,
                "nova_senha": "OutraSenha123",
                "confirmar_senha": "OutraSenha123",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(resposta.status_code, 401)

    def test_email_de_usuario_desativado_indica_onde_reativar(self) -> None:
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        self.desativar(bruno)

        resposta = self.client.post(
            "/api/administradores/",
            json={"nome": "Outro", "email": "bruno@exemplo.com", "senha": SENHA, "permissoes": []},
            headers=self.headers,
        )

        self.assertEqual(resposta.status_code, 400)
        self.assertIn("desativado", resposta.json()["detail"])
        self.assertIn("Bruno", resposta.json()["detail"])

    def test_reativar_usuario_inexistente_retorna_404(self) -> None:
        resposta = self.client.patch("/api/administradores/999/reativar", headers=self.headers)
        self.assertEqual(resposta.status_code, 404)

    def test_somente_administrador_reativa(self) -> None:
        bruno = self.cadastrar("Bruno", "bruno@exemplo.com")
        self.desativar(bruno)

        comum = self.criar_usuario(email="comum@exemplo.com")
        cabecalho = self.cabecalho_auth(comum)

        self.assertEqual(
            self.client.get(
                "/api/administradores/", params={"situacao": "inativos"}, headers=cabecalho
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/administradores/{bruno}/reativar", headers=cabecalho
            ).status_code,
            403,
        )

    def test_usuario_desativar_ou_reativar_repetido_avisa(self) -> None:
        usuario = self.criar_usuario(email="func@exemplo.com")

        self.assertEqual(
            self.client.patch(f"/api/administradores/{usuario.id}/reativar", headers=self.headers).status_code,
            409,
        )
        self.assertEqual(
            self.client.patch(f"/api/administradores/{usuario.id}/inativar", headers=self.headers).status_code,
            200,
        )
        self.assertEqual(
            self.client.patch(f"/api/administradores/{usuario.id}/inativar", headers=self.headers).status_code,
            400,
        )
