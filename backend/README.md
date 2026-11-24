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

   Para executar os testes, instale também as dependências de teste (esse arquivo já inclui as dependências de execução):
   ```bash
   pip install -r requirements-test.txt
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

   Preencha também as outras variáveis do `.env`:

   | Variável | Para que serve |
   |---|---|
   | `SECRET_KEY` | Assina os tokens de **login** de todo o sistema. Use qualquer texto longo e aleatório. |
   | `CORS_ORIGINS` | Endereços do painel e do site que podem chamar a API (separados por vírgula). |
   | `RUSTFS_ENDPOINT`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `RUSTFS_BUCKET` | Onde ficam os **arquivos enviados** (documentos, arquivos dos casos, fotos e imagens de capa). É um armazenamento compatível com S3. |

   > ⚠️ Se o seu `.env` apontar o RustFS para o servidor **de produção**, todo arquivo enviado enquanto você testa na sua máquina vai para o armazenamento real do escritório. Teste com arquivos sem importância e apague depois.
   >
   > Sem um RustFS acessível, o sistema funciona normalmente, menos o envio e o download de arquivos.

6. **Execute as Migrações** (cria as tabelas no banco):
   ```bash
   alembic upgrade head
   ```
   Se der `connection refused` aqui, o banco não está no ar — volte ao passo 4 e confira o `docker compose ps`.

7. **Crie o primeiro administrador** (sem ele, ninguém consegue entrar no painel):
   ```bash
   python -m scripts.criar_usuario
   ```
   O script pede nome, e-mail e senha (a senha não aparece enquanto você digita). Os demais usuários são criados depois, por esse administrador, na tela **Administradores** do painel.

   > Administradores só podem ser criados por este script. Os usuários criados pelo painel são usuários comuns, com as permissões escolhidas na hora do cadastro.

8. **Inicie o servidor de desenvolvimento:**
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
* `pip install -r requirements.txt`: instala/atualiza as dependências de execução da API.
* `pip install -r requirements-test.txt`: instala as dependências necessárias para a suíte automatizada.
* `python -m unittest discover -s tests -v`: executa todos os testes. A maioria roda num banco SQLite em memória e não precisa de Docker; os testes de integração usam o PostgreSQL da `DATABASE_URL` e são **pulados** se ele não estiver no ar.
* `python -m scripts.criar_usuario`: cria um usuário administrador.
* `python -m scripts.migrar_noticias --autor-email EMAIL`: importa as notícias iniciais do site (`scripts/noticias_iniciais.json`) como artigos publicados, sem duplicar as que já existem.
* **Nova biblioteca:** depois de `pip install nome-da-biblioteca`, acrescente a linha `nome-da-biblioteca==versão` ao `requirements.txt` (a versão aparece em `pip show nome-da-biblioteca`).
  > ⚠️ Evite `pip freeze > requirements.txt` no **PowerShell do Windows**: ele grava o arquivo em UTF-16 em vez de UTF-8, o que atrapalha outras ferramentas. Se quiser usar o `pip freeze`, rode no Git Bash ou use `pip freeze | Out-File -Encoding utf8 requirements.txt`.

### Docker (banco de dados) — rodar sempre na raiz do repositório
* `docker compose up -d`: sobe o container do Postgres em segundo plano.
* `docker compose ps`: mostra se o container está rodando (`Up`/`healthy`).
* `docker compose logs db`: mostra os logs do banco — útil se o `alembic upgrade head` não conseguir conectar.
* `docker compose down`: para o container, **mantendo** os dados salvos.
* `docker compose down -v`: para o container e **apaga** os dados do banco (reset completo — depois disso é preciso rodar `alembic upgrade head` de novo).

---

## ⚠️ Atenção

* O CORS da API usa a lista `CORS_ORIGINS` do `.env`. Inclua nela as origens exatas do painel e do site, separadas por vírgula. Curingas e URLs com caminhos são rejeitados porque a API aceita credenciais.
* Nunca faça commit do arquivo `.env` (ele já está no `.gitignore`) — apenas do `.env.example`, sem senhas reais.
* **Docker Desktop precisa estar aberto** antes de rodar qualquer `docker compose ...`, senão o comando falha na hora de falar com o daemon do Docker.
* O banco de dados **não é compartilhado** entre o time: cada pessoa tem seu próprio container e seus próprios dados, isolados na sua máquina.
* Se a porta `5432` estiver ocupada (por exemplo, por um PostgreSQL instalado no computador), pare esse serviço local. O `docker-compose.yml` usa a porta `5432` fixa; para usar outra, troque `"5432:5432"` por, por exemplo, `"5433:5432"` no `docker-compose.yml` e use a mesma porta (`5433`) na `DATABASE_URL`.
* Rode os comandos do backend (`uvicorn`, `alembic`, scripts e testes) **de dentro da pasta `backend/`**: o `.env` é lido da pasta em que o comando é executado.

---

## 🔐 Usuários, permissões e senhas

* Toda rota (menos as públicas, abaixo) exige login. O token vai no cabeçalho `Authorization: Bearer ...`.
* **Administradores** têm acesso a tudo e são os únicos que gerenciam usuários (`/api/administradores`).
* Os demais usuários têm permissões **por módulo** (`dashboard`, `clientes`, `casos`, `artigos`), cada uma com "visualizar" e "editar". A checagem é feita no backend em toda requisição.
* **Senhas:** o administrador define uma senha provisória ao criar o usuário, e o próprio usuário troca a senha depois de entrar (`POST /api/auth/alterar-minha-senha`, que exige a senha atual). Quem esquecer a senha recebe uma nova do administrador, pela tela Administradores. Não existe redefinição de senha sem login.
* **Inativação:** clientes, casos e usuários não são apagados, e sim inativados. As listagens aceitam `?situacao=inativos`, e cada um tem uma rota `.../reativar`. Usuários inativos não conseguem entrar e perdem o acesso na hora.

---

## 📎 Arquivos

| O quê | Rota | Limite |
|---|---|---|
| Documentos do cliente | `/api/clientes/{id}/documentos/` | 500 MB por arquivo |
| Arquivos do caso | `/api/casos/{id}/arquivos/` | 500 MB por arquivo |
| Foto do cliente / do caso | `/api/clientes/{id}/foto`, `/api/casos/{id}/foto` | 5 MB (JPG, PNG ou WEBP) |
| Imagens de capa dos artigos | `/api/imagens-artigos` | 10 MB |

Os arquivos ficam no RustFS; o banco guarda só os dados de cada arquivo. O download é feito por um link temporário (válido por 5 minutos), gerado pela rota `.../link`. Arquivos de cliente ou caso inativo podem ser consultados, mas não alterados.

---

## 📰 Artigos

As rotas administrativas em `/api/artigos` exigem a permissão do módulo `artigos` ("visualizar" para consultar, "editar" para criar, alterar, publicar e excluir). As rotas `/api/public/artigos` são públicas e retornam somente artigos **publicados**, não excluídos e com **resumo** e **conteúdo** preenchidos. Cada artigo pode ter uma imagem de capa enviada pelo painel ou uma das imagens padrão.

---

> 📌 Para regras de versionamento de código e commits, consulte o [README da raiz](../README.md).
