# 🔌 Backend — Sistema de Advocacia (API)

Documentação técnica e guia de inicialização da API. O backend é escrito em **Python**, usando **FastAPI**, **SQLAlchemy** e **Alembic** (migrações), com banco de dados **PostgreSQL**.

> Se você nunca trabalhou com Python, siga o passo a passo com calma — cada comando está explicado.

---

## 🚀 Como Executar o Projeto Pela Primeira Vez

### Pré-requisitos
* **Python 3.11+** instalado ([python.org/downloads](https://www.python.org/downloads/)) — confira com `python --version` ou `python3 --version`
* `pip` (já vem junto com o Python)
* **Docker Desktop** instalado e **aberto** ([docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)) — usamos ele para rodar o PostgreSQL localmente, sem precisar instalar o Postgres na máquina. Se preferir instalar o Postgres manualmente, também funciona, mas o passo a passo abaixo assume Docker.

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

4. **Suba o banco de dados (Docker):**
   O `docker-compose.yml` fica na **raiz do repositório**, não dentro de `backend/`. Em outro terminal (ou saindo temporariamente da pasta `backend`):
   ```bash
   cd ..
   docker compose up -d
   cd backend
   ```
   > ⚠️ O Docker Desktop precisa estar **aberto** antes de rodar esse comando, senão dá erro de conexão com o daemon do Docker.

   Confirme que o container subiu:
   ```bash
   docker compose ps
   ```
   *(rode esse comando também na raiz do projeto — deve mostrar o serviço `db` como `Up`)*

5. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo para criar o seu `.env` local:
   ```bash
   cp .env.example .env
   ```
   *(No Windows, se `cp` não funcionar, use `copy .env.example .env`)*

   Abra o `.env` criado e ajuste a `DATABASE_URL` para bater com o usuário/senha/banco definidos no `docker-compose.yml`:
   ```
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/sistema_advocacia
   ```
   > Não é preciso criar o banco `sistema_advocacia` manualmente — o container do Docker já cria ele sozinho na primeira vez que sobe.

6. **Execute as Migrações** (cria as tabelas no banco):
   ```bash
   alembic upgrade head
   ```
   Se der `connection refused` aqui, o banco não está no ar — volte ao passo 4 e confira o `docker compose ps`.

7. **Inicie o servidor de desenvolvimento:**
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

### Docker (banco de dados) — rodar sempre na raiz do repositório
* `docker compose up -d`: sobe o container do Postgres em segundo plano.
* `docker compose ps`: mostra se o container está rodando (`Up`/`healthy`).
* `docker compose logs db`: mostra os logs do banco — útil se o `alembic upgrade head` não conseguir conectar.
* `docker compose down`: para o container, **mantendo** os dados salvos.
* `docker compose down -v`: para o container e **apaga** os dados do banco (reset completo — depois disso é preciso rodar `alembic upgrade head` de novo).

---

## ⚠️ Atenção

* O CORS da API está configurado para aceitar requisições apenas de `http://localhost:5173` (a porta padrão do frontend). Se o frontend rodar em outra porta, os pedidos serão bloqueados pelo navegador — nesse caso, avise o time para ajustar o `main.py`.
* Nunca faça commit do arquivo `.env` (ele já está no `.gitignore`) — apenas do `.env.example`, sem senhas reais.
* **Docker Desktop precisa estar aberto** antes de rodar qualquer `docker compose ...`, senão o comando falha na hora de falar com o daemon do Docker.
* O banco de dados **não é compartilhado** entre o time: cada pessoa tem seu próprio container e seus próprios dados, isolados na sua máquina.
* Se você já tem um PostgreSQL instalado localmente (fora do Docker) e ele estiver ligado, a porta `5432` vai estar ocupada e o container do Docker pode falhar ao subir. Pare o serviço local do Postgres antes de rodar `docker compose up -d`, ou mude a porta mapeada no `docker-compose.yml`.

---

> 📌 Para regras de versionamento de código e commits, consulte o [README da raiz](../README.md).