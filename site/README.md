# Site institucional — Giongo & Raguzzoni (React + Vite)

Site desktop implementado a partir do Figma "Giongo e Raguzzoni (cópia)", página *Site Desktop*.

## Como rodar

A partir da raiz do repositório:

```bash
cd site
npm install
npm run dev      # http://localhost:5173
```

Para gerar a versão de produção, rode `npm run build`. Os arquivos saem na pasta `dist/`.

> As imagens já estão em `public/assets`. O script `npm run assets` só serve para baixá-las atraves do mcp que fizemos no figma para baixar todos os assets em uma pasta, mas como tem validade nao esta mais funcional.

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
                     BotaoVidro, Sanfona, Seletor, CarrosselDepoimentos, BotaoWhatsapp
  pages/             uma pasta de página por rota (JSX + CSS)
  styles/global.css  tokens do design system (cores, tipografia, efeito vidro)
```

Para adicionar uma notícia, inclua um item em `src/data/noticias.js`.
O botão "Ver mais..." aparece sozinho quando houver mais de 3 notícias.

## Pendências de conteúdo

- `src/data/faq.js`: só a primeira pergunta tem resposta no Figma. As demais estão com texto provisório.
- `src/data/areas.js`: o Figma só tem o texto de exemplo ("Título do detalhe").

Procure por `TODO` nesses arquivos.

## Deploy

É um app de rota única (SPA). No servidor, redirecione todas as rotas para `index.html`:

- **Vercel:** funciona sem configuração.
- **Netlify:** crie o arquivo `public/_redirects` com `/* /index.html 200`.
