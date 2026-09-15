# 🎨 Frontend — Sistema de Advocacia (Interface Web)

Documentação técnica e guia de inicialização da interface web. O frontend é escrito em **React**, usando **Vite** como bundler e **React Router** para navegação entre páginas.

---

## 🚀 Como Executar o Projeto Pela Primeira Vez

### Pré-requisitos
* **Node.js** instalado (versão LTS recomendada) — confira com `node --version`
* Gerenciador de pacotes `npm` (já vem junto com o Node.js)
* **Backend rodando** em `http://127.0.0.1:8000` — siga o [README do backend](../backend/README.md) antes de continuar, senão o login e as telas não vão carregar dados

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

> ⚠️ A URL da API (`http://127.0.0.1:8000`) está fixa no arquivo `src/services/api.js`. Não é necessário criar arquivo `.env` para rodar o projeto localmente. Se um dia o backend passar a rodar em outro endereço/porta, esse é o arquivo que precisa ser atualizado.

> ⚠️ Mantenha o frontend rodando na porta `5173` (a padrão do Vite). O backend está configurado para aceitar requisições vindas apenas de `http://localhost:5173`; se você mudar a porta, as requisições serão bloqueadas pelo navegador (erro de CORS).

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
├── src/
│   ├── pages/       # Telas da aplicação (Dashboard, Clientes, Casos, Agenda, Login)
│   ├── contexts/     # Contextos React (ex: AuthContext, autenticação)
│   ├── services/     # Comunicação com a API (api.js)
│   └── App.jsx        # Rotas da aplicação
```

---

> 📌 Para regras de versionamento de código e commits, consulte o [README da raiz](../README.md).
