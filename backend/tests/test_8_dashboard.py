"""
TESTE 8 — Resumo do Dashboard

Verifica os números do painel, a lista de atividades recentes e que cada
usuário só recebe os blocos dos módulos que pode visualizar.
"""

from datetime import timedelta

from app.core.tempo import agora_utc
from app.models.arquivo_caso import ArquivoCaso
from app.models.artigo import Artigo
from app.models.caso import Caso
from app.models.cliente import Cliente
from app.models.documento_cliente import DocumentoCliente
from tests.banco_memoria import TesteComBancoEmMemoria


class DashboardTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        self.admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(self.admin)

    # ------------------------------------------------------------------
    # Ajudantes
    # ------------------------------------------------------------------

    def salvar(self, objeto):
        self.session.add(objeto)
        self.session.commit()
        self.session.refresh(objeto)
        return objeto

    def cliente(self, nome: str, ativo: bool = True, dias_atras: int = 0) -> Cliente:
        return self.salvar(
            Cliente(nome=nome, ativo=ativo, criado_em=agora_utc() - timedelta(days=dias_atras))
        )

    def caso(self, cliente: Cliente, titulo: str, tipo: str, ativo: bool = True) -> Caso:
        return self.salvar(
            Caso(cliente_id=cliente.id, titulo=titulo, tipo_atendimento=tipo, ativo=ativo)
        )

    def arquivo(self, caso: Caso, nome: str) -> ArquivoCaso:
        return self.salvar(
            ArquivoCaso(
                caso_id=caso.id,
                enviado_por_id=self.admin.id,
                nome_original=nome,
                chave_storage=f"casos/{caso.id}/{nome}",
                content_type="application/pdf",
                tamanho_bytes=100,
            )
        )

    def documento(self, cliente: Cliente, nome: str) -> DocumentoCliente:
        return self.salvar(
            DocumentoCliente(
                cliente_id=cliente.id,
                enviado_por_id=self.admin.id,
                tag="CPF",
                nome_original=nome,
                chave_storage=f"clientes/{cliente.id}/{nome}",
                content_type="application/pdf",
                tamanho_bytes=100,
            )
        )

    def artigo(self, titulo: str, status: str = "rascunho", excluido: bool = False) -> Artigo:
        return self.salvar(
            Artigo(
                autor_id=self.admin.id,
                titulo=titulo,
                slug=titulo.lower().replace(" ", "-"),
                status=status,
                publicado_em=agora_utc() if status == "publicado" else None,
                excluido_em=agora_utc() if excluido else None,
            )
        )

    def resumo(self, headers=None):
        resposta = self.client.get("/api/dashboard/", headers=headers or self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return resposta.json()

    # ------------------------------------------------------------------
    # Testes
    # ------------------------------------------------------------------

    def test_banco_vazio_retorna_zeros(self) -> None:
        dados = self.resumo()

        self.assertEqual(dados["clientes"]["ativos"], 0)
        self.assertEqual(dados["casos"]["ativos"], 0)
        self.assertEqual(dados["casos"]["por_tipo"], [])
        self.assertEqual(dados["artigos"], {"publicados": 0, "rascunhos": 0})
        self.assertEqual(dados["atividades"], [])

    def test_conta_somente_registros_ativos(self) -> None:
        maria = self.cliente("Maria")
        joao = self.cliente("João")
        self.cliente("Antigo", dias_atras=90)
        self.cliente("Inativo", ativo=False)

        trabalhista = self.caso(maria, "Horas extras", "Trabalhista")
        self.caso(maria, "Rescisão", "Trabalhista")
        self.caso(joao, "Inventário", "Família")
        self.caso(joao, "Encerrado", "Família", ativo=False)

        self.arquivo(trabalhista, "peticao.pdf")
        self.documento(maria, "cpf.pdf")

        self.artigo("Publicado um", status="publicado")
        self.artigo("Rascunho um")
        self.artigo("Apagado", excluido=True)

        dados = self.resumo()

        self.assertEqual(
            dados["clientes"],
            {"ativos": 3, "novos_no_periodo": 2, "sem_casos_ativos": 1, "documentos": 1},
        )
        self.assertEqual(dados["casos"]["ativos"], 3)
        self.assertEqual(dados["casos"]["arquivos"], 1)
        self.assertEqual(
            dados["casos"]["por_tipo"],
            [{"tipo": "Trabalhista", "total": 2}, {"tipo": "Família", "total": 1}],
        )
        self.assertEqual(dados["artigos"], {"publicados": 1, "rascunhos": 1})

    def test_tipos_alem_do_limite_viram_outros(self) -> None:
        cliente = self.cliente("Maria")
        for indice, tipo in enumerate(["A", "B", "C", "D", "E", "F", "G"]):
            self.caso(cliente, f"Caso {indice}", tipo)

        por_tipo = self.resumo()["casos"]["por_tipo"]

        self.assertEqual(len(por_tipo), 6)
        self.assertEqual(por_tipo[-1], {"tipo": "Outros", "total": 2})

    def test_atividades_recentes_em_ordem_e_sem_inativos(self) -> None:
        maria = self.cliente("Maria", dias_atras=2)
        caso = self.caso(maria, "Horas extras", "Trabalhista")
        self.arquivo(caso, "peticao.pdf")
        self.artigo("Novidade", status="publicado")
        self.cliente("Inativo", ativo=False)

        atividades = self.resumo()["atividades"]

        titulos = [a["titulo"] for a in atividades]
        self.assertNotIn("Inativo", titulos)
        self.assertEqual(titulos[-1], "Maria")
        self.assertEqual(
            {a["tipo"] for a in atividades}, {"cliente", "caso", "arquivo", "artigo"}
        )

    def test_sem_permissao_no_dashboard_e_bloqueado(self) -> None:
        usuario = self.criar_usuario(email="sem@exemplo.com")
        self.dar_permissao(usuario, "clientes", pode_visualizar=True)

        resposta = self.client.get("/api/dashboard/", headers=self.cabecalho_auth(usuario))

        self.assertEqual(resposta.status_code, 403)

    def test_so_recebe_blocos_dos_modulos_que_pode_ver(self) -> None:
        maria = self.cliente("Maria")
        self.caso(maria, "Segredo", "Trabalhista")
        self.artigo("Novidade", status="publicado")

        usuario = self.criar_usuario(email="artigos@exemplo.com")
        self.dar_permissao(usuario, "dashboard", pode_visualizar=True)
        self.dar_permissao(usuario, "artigos", pode_editar=True)

        dados = self.resumo(self.cabecalho_auth(usuario))

        self.assertIsNone(dados["clientes"])
        self.assertIsNone(dados["casos"])
        self.assertEqual(dados["artigos"]["publicados"], 1)
        self.assertEqual([a["tipo"] for a in dados["atividades"]], ["artigo"])

    def test_sem_login_e_bloqueado(self) -> None:
        self.assertIn(self.client.get("/api/dashboard/").status_code, (401, 403))
