# 🔌 Backend — Sistema de Advocacia (API)

Documentação técnica e guia de inicialização da API. O backend é escrito em **Python**, usando **FastAPI**, **SQLAlchemy** e **Alembic** (migrações), com banco de dados **PostgreSQL**.

> Se você nunca trabalhou com Python, siga o passo a passo com calma — cada comando está explicado.

---

## 🚀 Como Executar o Projeto Pela Primeira Vez

### Pré-requisitos
* **Python 3.11+** instalado ([python.org/downloads](https://www.python.org/downloads/)) — confira com `python --version` ou `python3 --version`
* **PostgreSQL** instalado e rodando localmente ([postgresql.org/download](https://www.postgresql.org/download/))
* `pip` (já vem junto com o Python)

---

### Passo a Passo

1. **Acesse a pasta do backend:**
   ```bash
   cd backend
   ```

2. **Crie um ambiente virtual** (isola as dependências deste projeto do resto do seu computador):

   No Windows:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
   No macOS/Linux:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
   > Você vai saber que funcionou porque o terminal passa a mostrar `(venv)` no início da linha. **Sempre que for trabalhar no backend, ative o ambiente virtual primeiro.**

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo para criar o seu `.env` local:
   ```bash
   cp .env.example .env
   ```
   *(No Windows, se `cp` não funcionar, use `copy .env.example .env`)*

   Abra o `.env` criado e ajuste a `DATABASE_URL` com os dados do seu PostgreSQL local, por exemplo:
   ```
   DATABASE_URL=postgresql+psycopg2://postgres:SUA_SENHA@localhost:5432/sistema_advocacia
   ```
   Antes de continuar, **crie o banco de dados** `sistema_advocacia` no seu PostgreSQL (ou o nome que você definir na URL acima).

5. **Execute as Migrações** (cria as tabelas no banco):
   ```bash
   alembic upgrade head
   ```

6. **Inicie o servidor de desenvolvimento:**
   ```bash
   uvicorn main:app --reload
   ```

O servidor estará rodando em `http://localhost:8000`.

Para conferir se está tudo funcionando, acesse no navegador:
* `http://localhost:8000` → deve retornar uma mensagem confirmando que a API está no ar
* `http://localhost:8000/docs` → documentação interativa da API (Swagger), gerada automaticamente pelo FastAPI. É útil para testar os endpoints sem precisar do frontend.

---

## 🛠️ Comandos Úteis

* `uvicorn main:app --reload`: inicia a API em modo desenvolvimento (recarrega sozinha a cada alteração de código).
* `alembic upgrade head`: aplica todas as migrações pendentes no banco de dados.
* `alembic revision --autogenerate -m "descricao da mudanca"`: gera uma nova migração automaticamente com base nas alterações feitas nos modelos (rode isso sempre que criar/alterar uma tabela).
* `pip install -r requirements.txt`: instala/atualiza as dependências do projeto.
* `pip freeze > requirements.txt`: se você instalar uma nova biblioteca, rode este comando para adicioná-la à lista de dependências antes de commitar.

---

## ⚠️ Atenção

* O CORS da API está configurado para aceitar requisições apenas de `http://localhost:5173` (a porta padrão do frontend). Se o frontend rodar em outra porta, os pedidos serão bloqueados pelo navegador — nesse caso, avise o time para ajustar o `main.py`.
* Nunca faça commit do arquivo `.env` (ele já está no `.gitignore`) — apenas do `.env.example`, sem senhas reais.

---

> 📌 Para regras de versionamento de código e commits, consulte o [README da raiz](../README.md).
