"""Catálogo das imagens padrão de capa dos artigos.

Os arquivos ficam em app/static/imagens_padrao e são servidos pela rota
pública /api/public/imagens-artigos/padrao/{chave}. Para incluir uma nova
imagem padrão, basta colocar o arquivo na pasta e registrá-lo aqui.
"""

from dataclasses import dataclass
from pathlib import Path

PASTA = Path(__file__).resolve().parent.parent / "static" / "imagens_padrao"

PREFIXO_URL = "/api/public/imagens-artigos"

# Usada quando o artigo não escolheu nenhuma imagem
CHAVE_PADRAO = "geral"


@dataclass(frozen=True)
class ImagemPadrao:
    chave: str
    titulo: str
    texto_alternativo: str
    arquivo: str
    content_type: str

    @property
    def caminho(self) -> Path:
        return PASTA / self.arquivo

    @property
    def url(self) -> str:
        return f"{PREFIXO_URL}/padrao/{self.chave}"


_SVG = "image/svg+xml"

IMAGENS_PADRAO: dict[str, ImagemPadrao] = {
    imagem.chave: imagem
    for imagem in (
        ImagemPadrao("geral", "Justiça (geral)", "Ilustração de uma balança da justiça", "geral.svg", _SVG),
        ImagemPadrao("empresarial", "Direito empresarial", "Ilustração de uma maleta de trabalho", "empresarial.svg", _SVG),
        ImagemPadrao("contratos", "Contratos", "Ilustração de um contrato sendo assinado", "contratos.svg", _SVG),
        ImagemPadrao("medico", "Direito médico", "Ilustração de uma cruz médica com linha de batimentos", "medico.svg", _SVG),
        ImagemPadrao("tributario", "Tributário", "Ilustração de um documento com porcentagem e moedas", "tributario.svg", _SVG),
        ImagemPadrao("familia", "Família e sucessões", "Ilustração de uma casa com um coração", "familia.svg", _SVG),
        ImagemPadrao("holding", "Holding e patrimônio", "Ilustração de um edifício com colunas", "holding.svg", _SVG),
        ImagemPadrao("lgpd", "LGPD (ilustração)", "Ilustração de um escudo com cadeado", "lgpd.svg", _SVG),
        ImagemPadrao(
            "protecao-de-dados",
            "Proteção de dados (foto)",
            "Mãos abertas sob um cadeado digital iluminado",
            "protecao-de-dados.jpg",
            "image/jpeg",
        ),
        ImagemPadrao(
            "pessoas",
            "Pessoas (ilustração)",
            "Ilustração de silhuetas de pessoas diversas em tons de azul e verde",
            "pessoas.webp",
            "image/webp",
        ),
    )
}


def buscar_imagem_padrao(chave: str | None) -> ImagemPadrao:
    """Imagem padrão da chave informada; chave vazia ou desconhecida usa a geral."""

    return IMAGENS_PADRAO.get(chave or "", IMAGENS_PADRAO[CHAVE_PADRAO])


def url_imagem_enviada(imagem_id: int) -> str:
    return f"{PREFIXO_URL}/{imagem_id}"
