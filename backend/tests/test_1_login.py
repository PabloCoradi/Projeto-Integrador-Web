"""
TESTE 1 — Login (autenticação com JWT)

Verifica se a rota POST /api/auth/login libera o acesso só para quem tem
e-mail e senha corretos, e se o token gerado funciona nas rotas protegidas.
"""

from jose import jwt

from app.core.security import ALGORITHM, SECRET_KEY
from tests.banco_memoria import TesteComBancoEmMemoria


class LoginTest(TesteComBancoEmMemoria):
    def test_login_com_dados_corretos_retorna_token_valido(self) -> None:
        usuario = self.criar_usuario(email="ana@exemplo.com", senha="SenhaForte123")

        resposta = self.client.post(
            "/api/auth/login",
            json={"email": "ana@exemplo.com", "senha": "SenhaForte123"},
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        corpo = resposta.json()
        self.assertEqual(corpo["token_type"], "bearer")

        # O token precisa carregar o id do usuário que fez login
        payload = jwt.decode(corpo["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
        self.assertEqual(payload["sub"], str(usuario.id))

        # E precisa abrir a rota protegida /api/auth/me
        me = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {corpo['access_token']}"},
        )
        self.assertEqual(me.status_code, 200, me.text)
        self.assertEqual(me.json()["email"], "ana@exemplo.com")

    def test_email_com_letras_maiusculas_tambem_funciona(self) -> None:
        self.criar_usuario(email="ana@exemplo.com", senha="SenhaForte123")

        resposta = self.client.post(
            "/api/auth/login",
            json={"email": "ANA@Exemplo.com", "senha": "SenhaForte123"},
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)

    def test_senha_errada_retorna_401(self) -> None:
        self.criar_usuario(email="ana@exemplo.com", senha="SenhaForte123")

        resposta = self.client.post(
            "/api/auth/login",
            json={"email": "ana@exemplo.com", "senha": "senha-errada"},
        )

        self.assertEqual(resposta.status_code, 401)
        self.assertNotIn("access_token", resposta.json())

    def test_usuario_inativo_nao_consegue_logar(self) -> None:
        self.criar_usuario(email="ex@exemplo.com", senha="SenhaForte123", ativo=False)

        resposta = self.client.post(
            "/api/auth/login",
            json={"email": "ex@exemplo.com", "senha": "SenhaForte123"},
        )

        self.assertEqual(resposta.status_code, 401)
