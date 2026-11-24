# 🎨 Frontend — Sistema de Advocacia (Interface Web)

Documentação técnica e guia de inicialização da interface web. O frontend é escrito em **React**, usando **Vite** como bundler e **React Router** para navegação entre páginas.

---

## 🚀 Como Executar o Projeto Pela Primeira Vez

### Pré-requisitos
* **Node.js** instalado (versão LTS recomendada) — confira com `node --version`
* Gerenciador de pacotes `npm` (já vem junto com o Node.js)
* **Backend rodando** em `http://127.0.0.1:8000` — siga primeiro o [README do backend](../backend/README.md), que inclui subir o banco de dados via Docker antes do próprio backend. Sem isso, o login e as telas não vão carregar dados.

---

### Passo a Passo

1. **Acesse a pasta do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie a aplicação de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. Acesse no navegador o endereço mostrado no terminal — normalmente:
   ```
   http://localhost:5173
   ```

5. Entre com o administrador criado pelo script `python -m scripts.criar_usuario` (veja o [README do backend](../backend/README.md)). Os demais usuários são cadastrados por ele na tela **Administradores**.

### Endereço da API

O endereço da API vem da variável `VITE_API_URL`. Sem ela, o painel usa `http://127.0.0.1:8000`, então **não é preciso criar `.env` para rodar localmente**. Para apontar para outro backend, crie um arquivo `.env` na pasta `frontend/`:

```
VITE_API_URL=http://127.0.0.1:8001
```

Em produção, o arquivo `.env.production` deixa `VITE_API_URL` vazia: o painel chama `/api/...` no próprio endereço, e o Nginx repassa para o backend. O Vite grava esse valor no `npm run build`, então qualquer mudança exige gerar o build de novo.

> ⚠️ O backend só aceita chamadas das origens listadas em `CORS_ORIGINS` (por padrão, as portas `5173` e `5174` de `localhost` e `127.0.0.1`). Se o painel rodar em outra porta, inclua o endereço em `CORS_ORIGINS` no `.env` do backend, senão o navegador bloqueia as requisições (erro de CORS). Se o site institucional já estiver usando a `5173`, o Vite sobe o painel na `5174`, que também é aceita.

---

## 🛠️ Scripts Disponíveis

* `npm run dev`: inicia o servidor local de desenvolvimento com hot-reload.
* `npm run build`: compila os arquivos para o ambiente de produção (gera a pasta `dist/`).
* `npm run preview`: sobe um servidor local para visualizar o build de produção gerado pelo `build`.
* `npm run lint`: roda o linter (oxlint) para checar problemas de estilo/qualidade no código.

---

## 📁 Estrutura relevante

```text
frontend/
├── .env.production   # VITE_API_URL vazia: em produção a API é chamada em /api
├── src/
│   ├── pages/        # Telas: Dashboard, Clientes, Casos, Artigos, Administradores, Login
│   ├── components/   # Peças reutilizadas entre telas (ex.: botão de arquivos, filtro Ativos/Inativos, etiquetas)
│   ├── contexts/     # AuthContext: login, usuário logado e permissões
│   ├── services/     # Comunicação com a API (api.js e um arquivo por módulo)
│   ├── utils/        # Funções de apoio (ex.: formatação de datas e tamanhos)
│   ├── assets/       # Ícones e imagens do painel e do login
│   ├── App.jsx       # Rotas, menu lateral e barra superior
│   └── App.css       # Estilos gerais do painel
```

### Permissões na tela

O menu lateral e as rotas mostram só os módulos que o usuário pode **visualizar**, e os botões de cadastrar, editar e inativar só aparecem para quem pode **editar** (veja `podeVisualizar` e `podeEditar` no `AuthContext`). Isso é só para a interface: quem garante as permissões de verdade é o backend.

---

> 📌 Para regras de versionamento de código e commits, consulte o [README da raiz](../README.md).