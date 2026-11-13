"""
TESTE 7 — Imagens de capa dos artigos

Verifica o envio de imagens (validação, redução e conversão para WEBP), as
imagens padrão, a escolha da capa no artigo, a entrega pública para o site e
a proteção contra remover uma imagem que ainda é capa de algum artigo.

O RustFS é substituído por dublês: nenhum arquivo sai da máquina.
"""

from io import BytesIO
from unittest.mock import patch

from PIL import Image

from tests.banco_memoria import TesteComBancoEmMemoria


def gerar_imagem(formato="PNG", tamanho=(800, 600), cor=(0, 129, 136)) -> bytes:
    saida = BytesIO()
    Image.new("RGB", tamanho, cor).save(saida, formato)
    return saida.getvalue()


class ImagensArtigosTest(TesteComBancoEmMemoria):
    def setUp(self) -> None:
        super().setUp()

        self.armazenado = {}

        def guardar(arquivo, chave, content_type):
            self.armazenado[chave] = arquivo.read()

        def ler(chave):
            dados = self.armazenado[chave]
            return iter([dados]), "image/webp", len(dados)

        for alvo, efeito in (
            ("app.services.imagem_artigo_service.enviar_arquivo", guardar),
            ("app.routers.imagens_artigos.baixar_arquivo", ler),
        ):
            dublê = patch(alvo, side_effect=efeito)
            dublê.start()
            self.addCleanup(dublê.stop)

        admin = self.criar_usuario(email="admin@exemplo.com", is_admin=True)
        self.headers = self.cabecalho_auth(admin)

    # ------------------------------------------------------------------

    def enviar_imagem(self, conteudo=None, nome="capa.png", headers=None):
        return self.client.post(
            "/api/imagens-artigos",
            files={"arquivo": (nome, conteudo if conteudo is not None else gerar_imagem(), "image/png")},
            headers=headers or self.headers,
        )

    def criar_artigo(self, **capa):
        corpo = {
            "titulo": "Guarda compartilhada",
            "resumo": "O que muda na guarda dos filhos",
            "conteudo": "Primeiro parágrafo.\n\nSegundo parágrafo.",
            **capa,
        }
        return self.client.post("/api/artigos", json=corpo, headers=self.headers)

    def publicar(self, artigo_id):
        resposta = self.client.post(f"/api/artigos/{artigo_id}/publicar", headers=self.headers)
        self.assertEqual(resposta.status_code, 200, resposta.text)
        return resposta.json()

    # ------------------------------------------------------------------

    def test_envio_reduz_e_converte_para_webp_na_pasta_artigos(self) -> None:
        resposta = self.enviar_imagem(gerar_imagem(tamanho=(3200, 1000)))

        self.assertEqual(resposta.status_code, 201, resposta.text)
        imagem = resposta.json()
        self.assertEqual((imagem["largura"], imagem["altura"]), (1600, 500))
        self.assertEqual(imagem["url"], f"/api/public/imagens-artigos/{imagem['id']}")

        (chave, dados), = self.armazenado.items()
        self.assertTrue(chave.startswith("artigos/"))
        self.assertEqual(Image.open(BytesIO(dados)).format, "WEBP")

    def test_recusa_arquivo_que_nao_e_imagem_formato_nao_aceito_e_vazio(self) -> None:
        self.assertEqual(self.enviar_imagem(b"nao sou uma imagem", nome="falsa.jpg").status_code, 400)
        self.assertEqual(self.enviar_imagem(gerar_imagem("GIF"), nome="a.gif").status_code, 400)
        self.assertEqual(self.enviar_imagem(b"").status_code, 400)
        self.assertEqual(self.armazenado, {})

    def test_usuario_sem_permissao_de_edicao_nao_envia(self) -> None:
        leitor = self.criar_usuario(email="leitor@exemplo.com")
        self.dar_permissao(leitor, "artigos", pode_visualizar=True)
        headers = self.cabecalho_auth(leitor)

        self.assertEqual(self.enviar_imagem(headers=headers).status_code, 403)
        self.assertEqual(self.client.get("/api/imagens-artigos", headers=headers).status_code, 200)
        self.assertIn(self.client.get("/api/imagens-artigos").status_code, (401, 403))

    def test_imagens_padrao_sao_listadas_e_servidas_publicamente(self) -> None:
        lista = self.client.get("/api/public/imagens-artigos/padrao").json()
        chaves = {imagem["chave"] for imagem in lista}
        self.assertTrue({"geral", "familia", "lgpd"} <= chaves)

        svg = self.client.get("/api/public/imagens-artigos/padrao/familia")
        self.assertEqual(svg.status_code, 200)
        self.assertTrue(svg.headers["content-type"].startswith("image/svg+xml"))
        self.assertIn("sandbox", svg.headers["content-security-policy"])

        self.assertEqual(
            self.client.get("/api/public/imagens-artigos/padrao/nao-existe").status_code,
            404,
        )

    def test_artigo_sem_capa_usa_a_imagem_geral_no_site(self) -> None:
        artigo = self.criar_artigo().json()
        self.publicar(artigo["id"])

        item = self.client.get("/api/public/artigos").json()["items"][0]
        self.assertEqual(item["imagem_url"], "/api/public/imagens-artigos/padrao/geral")
        self.assertEqual(item["imagem_alt"], "Ilustração de uma balança da justiça")

    def test_artigo_com_imagem_padrao(self) -> None:
        artigo = self.criar_artigo(imagem_padrao="familia").json()
        self.publicar(artigo["id"])

        publico = self.client.get(f"/api/public/artigos/{artigo['slug']}").json()
        self.assertEqual(publico["imagem_url"], "/api/public/imagens-artigos/padrao/familia")

        self.assertEqual(self.criar_artigo(imagem_padrao="inexistente").status_code, 422)

    def test_artigo_com_imagem_enviada_e_entrega_publica(self) -> None:
        imagem = self.enviar_imagem().json()
        artigo = self.criar_artigo(imagem_id=imagem["id"], imagem_alt="Família reunida").json()
        self.publicar(artigo["id"])

        publico = self.client.get(f"/api/public/artigos/{artigo['slug']}").json()
        self.assertEqual(publico["imagem_url"], imagem["url"])
        self.assertEqual(publico["imagem_alt"], "Família reunida")

        arquivo = self.client.get(imagem["url"])
        self.assertEqual(arquivo.status_code, 200)
        self.assertEqual(arquivo.headers["content-type"], "image/webp")
        self.assertIn("immutable", arquivo.headers["cache-control"])
        self.assertEqual(Image.open(BytesIO(arquivo.content)).format, "WEBP")

    def test_recusa_duas_capas_ou_imagem_inexistente(self) -> None:
        imagem_id = self.enviar_imagem().json()["id"]

        self.assertEqual(self.criar_artigo(imagem_id=imagem_id, imagem_padrao="geral").status_code, 422)
        self.assertEqual(self.criar_artigo(imagem_id=99999).status_code, 422)

    def test_escolher_capa_padrao_descarta_a_enviada(self) -> None:
        imagem_id = self.enviar_imagem().json()["id"]
        artigo = self.criar_artigo(imagem_id=imagem_id).json()

        resposta = self.client.patch(
            f"/api/artigos/{artigo['id']}", json={"imagem_padrao": "lgpd"}, headers=self.headers
        )

        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.assertIsNone(resposta.json()["imagem_id"])
        self.assertEqual(resposta.json()["imagem_padrao"], "lgpd")

    def test_nao_remove_imagem_que_ainda_e_capa(self) -> None:
        imagem = self.enviar_imagem().json()
        artigo = self.criar_artigo(imagem_id=imagem["id"]).json()
        rota = f"/api/imagens-artigos/{imagem['id']}"

        self.assertEqual(self.client.delete(rota, headers=self.headers).status_code, 409)

        self.client.patch(f"/api/artigos/{artigo['id']}", json={"imagem_id": None}, headers=self.headers)

        self.assertEqual(self.client.delete(rota, headers=self.headers).status_code, 204)
        self.assertEqual(self.client.get(imagem["url"]).status_code, 404)
        self.assertEqual(self.client.get("/api/imagens-artigos", headers=self.headers).json(), [])
