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

> As imagens já estão em `public/assets`. O script `npm run assets` só serve para baixá-las de novo do Figma,
> e os links de exportação expiram cerca de 7 dias depois de gerados (gerados em 16/09/2026). Se precisar
> atualizar alguma imagem, exporte-a do Figma e salve em `public/assets` com o nome listado em `scripts/baixar-assets.mjs`.

## Páginas

| Rota | Página do Figma |
| --- | --- |
| `/` | Página Inicial |
| `/areas-de-atuacao` | Áreas de Atuação |

## Estrutura

```
src/
  assets.js          caminhos das imagens
  data/              textos: áreas, depoimentos, contato
  components/        Cabecalho, Rodape, Contato, CtaFaq, Hero, TituloSecao,
                     BotaoVidro, Sanfona, CarrosselDepoimentos, BotaoWhatsapp
  pages/             uma pasta de página por rota (JSX + CSS)
  styles/global.css  tokens do design system (cores, tipografia, efeito vidro)
```

## Pendências de conteúdo

- `src/data/areas.js`: o Figma só tem o texto de exemplo ("Título do detalhe").

Procure por `TODO` nesse arquivo.

## Deploy

É um app de rota única (SPA). No servidor, redirecione todas as rotas para `index.html`:

- **Vercel:** funciona sem configuração.
- **Netlify:** crie o arquivo `public/_redirects` com `/* /index.html 200`.
