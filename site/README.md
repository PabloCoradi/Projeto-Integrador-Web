# Site institucional — Giongo & Raguzzoni (React + Vite)

Site institucional implementado a partir do Figma "Giongo e Raguzzoni (cópia)", páginas *Site Desktop* e *Site Mobile*.

## Como rodar

A partir da raiz do repositório:

```bash
cd site
npm install
npm run dev      # http://localhost:5173
```

Para gerar a versão de produção, rode `npm run build`. Os arquivos saem na pasta `dist/`.

> As imagens já estão em `public/assets`. O script `npm run assets` só serve para baixá-las atraves do mcp que fizemos no figma para baixar todos os assets em uma pasta, mas como tem validade nao esta mais funcional.

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
  assets.js          caminhos das imagens
  data/              textos: notícias, FAQ, áreas, depoimentos, advogadas, contato
  components/        Cabecalho, Rodape, Contato, CtaFaq, Hero, TituloSecao,
                     BotaoVidro, Sanfona, Seletor, CarrosselAreas,
                     CarrosselDepoimentos, BotaoWhatsapp, useMobile (hook)
  pages/             uma pasta de página por rota (JSX + CSS)
  styles/global.css  tokens do design system (cores, tipografia, efeito vidro)
```

Para adicionar uma notícia, inclua um item em `src/data/noticias.js`.
O botão "Ver mais..." aparece sozinho quando houver mais de 3 notícias.

## Deploy

É um app de rota única (SPA). No servidor, redirecione todas as rotas para `index.html`:

- **Vercel:** funciona sem configuração.
- **Netlify:** crie o arquivo `public/_redirects` com `/* /index.html 200`.
