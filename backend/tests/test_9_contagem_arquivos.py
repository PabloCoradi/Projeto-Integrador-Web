"""
TESTE 9 — Quantidade de arquivos nas listagens

As listas de clientes e de casos informam quantos arquivos ativos cada
registro tem, para o painel destacar quem já possui documentos anexados.
"""

from app.models.arquivo_caso import ArquivoCaso
from app.models.caso import Caso
from app.models.cliente import Cliente
from app.models.documento_cliente import DocumentoCliente
from tests.banco_memoria import TesteComBancoEmMemoria


class ContagemArquivosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()
        self.admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(self.admin)

        self.com_arquivos = Cliente(nome="Com arquivos")
        self.sem_arquivos = Cliente(nome="Sem arquivos")
        self.session.add_all([self.com_arquivos, self.sem_arquivos])
        self.session.commit()

    def anexar(self, modelo, nome: str, ativo: bool = True, **vinculo):
        self.session.add(
            modelo(
                enviado_por_id=self.admin.id,
                tag="OUTROS",
                nome_original=nome,
                chave_storage=f"teste/{nome}",
                content_type="application/pdf",
                tamanho_bytes=10,
                ativo=ativo,
                **vinculo,
            )
        )
        self.session.commit()

    def test_lista_de_clientes_conta_documentos_ativos(self) -> None:
        cliente_id = self.com_arquivos.id
        self.anexar(DocumentoCliente, "cpf.pdf", cliente_id=cliente_id)
        self.anexar(DocumentoCliente, "rg.pdf", cliente_id=cliente_id)
        self.anexar(DocumentoCliente, "apagado.pdf", ativo=False, cliente_id=cliente_id)

        lista = self.client.get("/api/clientes/", headers=self.headers).json()
        quantidades = {c["nome"]: c["quantidade_documentos"] for c in lista}

        self.assertEqual(quantidades, {"Com arquivos": 2, "Sem arquivos": 0})

    def test_lista_de_casos_conta_arquivos_ativos(self) -> None:
        caso_com = Caso(
            cliente_id=self.com_arquivos.id, titulo="Com anexo", tipo_atendimento="Cível"
        )
        caso_sem = Caso(
            cliente_id=self.com_arquivos.id, titulo="Sem anexo", tipo_atendimento="Cível"
        )
        self.session.add_all([caso_com, caso_sem])
        self.session.commit()

        self.anexar(ArquivoCaso, "peticao.pdf", caso_id=caso_com.id)
        self.anexar(ArquivoCaso, "apagado.pdf", ativo=False, caso_id=caso_com.id)

        lista = self.client.get("/api/casos/", headers=self.headers).json()
        quantidades = {c["titulo"]: c["quantidade_arquivos"] for c in lista}

        self.assertEqual(quantidades, {"Com anexo": 1, "Sem anexo": 0})

        detalhe = self.client.get(f"/api/casos/{caso_com.id}", headers=self.headers).json()
        self.assertEqual(detalhe["quantidade_arquivos"], 1)
