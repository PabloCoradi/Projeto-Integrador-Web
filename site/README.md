# Site institucional — Giongo & Raguzzoni (React + Vite)

Site institucional implementado a partir do Figma "Giongo e Raguzzoni (cópia)", páginas *Site Desktop* e *Site Mobile*.

## Como rodar

A partir da raiz do repositório:

```bash
cd site
npm install
npm run dev      # normalmente http://localhost:5173
```

> Se o painel (`frontend/`) já estiver rodando na `5173`, o Vite sobe o site na próxima porta livre (`5174`). O endereço certo aparece no terminal.

Para gerar a versão de produção, rode `npm run build`. Os arquivos saem na pasta `dist/`.

### Notícias (vêm do backend)

As páginas `/noticias` e `/noticias/:slug` buscam os artigos **publicados** na API pública do backend
(`GET /api/public/artigos` e `GET /api/public/artigos/{slug}`). O resto do site não depende do backend:
sem ele, só a página de Notícias fica sem conteúdo.

O endereço da API fica na variável `VITE_API_URL`. Copie o exemplo e ajuste se precisar:

```bash
cp .env.example .env   # VITE_API_URL=http://127.0.0.1:8000
```

Sem o arquivo `.env`, o site usa `http://127.0.0.1:8000`. Em produção, o `.env.production` deixa
`VITE_API_URL` vazia: o site chama `/api/...` no próprio endereço e o Nginx repassa para o backend.
O Vite grava esse valor no `npm run build`, então qualquer mudança exige gerar o build de novo.
Rodando localmente, o backend precisa liberar o endereço do site em `CORS_ORIGINS`.

Para aparecer no site, o artigo precisa estar com status **publicado** e ter **resumo** e **conteúdo**.
No conteúdo, cada linha em branco separa um parágrafo. A imagem de cada notícia é a **capa escolhida no
painel** (uma imagem enviada ou uma das imagens padrão); o site recebe o endereço dela no campo `imagem_url`.

> As imagens fixas do site (fotos, ícones e logos) já estão em `public/assets`. O script `npm run assets`
> foi usado uma única vez para baixá-las do Figma, por uma integração com link temporário que já expirou;
> hoje ele não funciona mais e não é necessário.

## Desktop e celular

O layout segue duas páginas do Figma: **Site Desktop** e **Site Mobile** (frame de 390px).
Abaixo de **768px** de largura valem as regras do Site Mobile. Elas ficam no fim de cada arquivo CSS,
dentro de `@media (max-width: 767px)`, e o hook `src/components/useMobile.js` usa o mesmo ponto de quebra
quando o React precisa saber se está no celular (menu hambúrguer, depoimentos para arrastar e notícias de 2 em 2).

### Telas grandes (acima de 1440px)

O Site Desktop foi desenhado num quadro de 1440px. Em telas maiores (1920px, 2560px…) o layout inteiro cresce
junto (textos, espaçamentos, cards e fotos), para nada ficar pequeno ou fora do lugar. Isso é feito pela unidade
`--u` do `styles/global.css`: vale 1px até 1440px de largura e aumenta acima disso. O quanto cresce é definido por
`--crescimento` no mesmo arquivo (hoje `0.5`: em 1920px tudo fica 1,17× maior; `1` acompanharia a tela inteira,
como o modo apresentação do Figma; `0` não cresceria nada). Nas regras de desktop, use `calc(N * var(--u))` no lugar de `Npx`; nas regras de tablet e celular
(`@media (max-width: ...)`) continue usando `px`.

## Páginas

| Rota | Página do Figma |
| --- | --- |
| `/` | Página Inicial |
| `/areas-de-atuacao` | Áreas de Atuação |
| `/quem-somos` | Quem somos |
| `/noticias` | Notícias |
| `/noticias/:slug` | Página da Notícia 1, 2 e 3 |
| `/perguntas-frequentes` | Perguntas frequentes |

## Estrutura

```
src/
  assets.js          caminhos das imagens de public/assets
  data/              textos: FAQ, áreas, depoimentos, advogadas e contato
  services/          artigos.js: busca as notícias na API do backend
  components/        Cabecalho, Rodape, Contato, CtaFaq, Hero, TituloSecao,
                     BotaoVidro, Sanfona, Seletor, CarrosselAreas,
                     CarrosselDepoimentos, BotaoWhatsapp,
                     ControleRolagem (volta ao topo ao trocar de página),
                     useMobile (hook), inerte e rolarParaContato (funções de apoio)
  pages/             um par de arquivos por rota: Pagina.jsx + Pagina.css
  styles/global.css  tokens do design system (cores, tipografia, efeito vidro)
```

Para adicionar uma notícia, escreva e publique um artigo na tela **Artigos** do painel (veja "Notícias" acima).
O botão "Ver mais..." aparece sozinho quando houver mais notícias publicadas (3 por vez no desktop, 2 no celular).

## Deploy

O site roda na VM de produção junto com o painel e o backend (veja a seção "Produção" do
[README da raiz](../README.md)):

1. Gere o build na VM: `npm ci && npm run build` (usa o `.env.production`).
2. Copie o conteúdo de `dist/` para a pasta que o Nginx entrega na porta 80.

É um app de rota única (SPA): o Nginx (`deploy/nginx/default.conf`) já manda todas as rotas para o
`index.html` (`try_files $uri $uri/ /index.html`), então links como `/noticias/algum-slug` funcionam
mesmo abertos direto no navegador.
