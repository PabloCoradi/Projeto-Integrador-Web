# Projeto Integrador Web — Sistema de Advocacia

Bem-vindo ao repositório do **Projeto Integrador Web**. O projeto é um sistema de gestão para escritório de advocacia, organizado como **Monorepo** (Frontend e Backend no mesmo repositório).

Se você nunca usou Git/GitHub antes, não se preocupe: este documento tem tudo explicado passo a passo.

---

## 📁 Estrutura do Repositório

```text
Projeto-Integrador-Web/
├── backend/    # API em Python (FastAPI) — regras de negócio e banco de dados
├── frontend/   # Interface web em React (Vite) — o que o usuário vê e usa
├── PRD.pdf     # Documento de requisitos do produto
├── .gitignore
└── README.md   # Este arquivo (documentação geral)
```

> ⚠️ As pastas se chamam exatamente `backend` e `frontend` (não `back`/`front`). Preste atenção ao nome quando for usar `cd` no terminal.

Para instruções detalhadas de instalação e execução de cada camada, acesse:
* 🔌 [Documentação do Backend](./backend/README.md)
* 🎨 [Documentação do Frontend](./frontend/README.md)

**Importante:** o Backend precisa estar rodando para o Frontend conseguir buscar dados da API. Siga sempre nessa ordem: 1) suba o Backend, 2) depois suba o Frontend.

---

## 🆕 Primeiros passos (para quem nunca usou Git/GitHub)

1. **Instale o Git** no seu computador: [git-scm.com/downloads](https://git-scm.com/downloads)
2. **Clone o repositório** (baixa uma cópia local do projeto):
   ```bash
   git clone https://github.com/PabloCoradi/Projeto-Integrador-Web.git
   ```
3. **Entre na pasta do projeto:**
   ```bash
   cd Projeto-Integrador-Web
   ```
4. A partir daqui, siga o README do [Backend](./backend/README.md) e depois o do [Frontend](./frontend/README.md).

Conceitos rápidos que você vai usar bastante:
* **branch**: uma "cópia paralela" do código onde você trabalha na sua tarefa sem afetar o código dos outros.
* **commit**: um "salvamento" das suas alterações, com uma mensagem explicando o que mudou.
* **push**: enviar seus commits para o GitHub (para os outros verem).
* **Pull Request (PR)**: um pedido para juntar o que você fez na branch `main` (a branch oficial do projeto).

---

## 🔀 Fluxo de Trabalho Git (Git Flow)

Para manter o repositório organizado em um ambiente Monorepo, siga os padrões descritos abaixo para criação de branches e commits.

### 1. Atualizar a branch principal (`main`)
Antes de iniciar qualquer nova tarefa, certifique-se de que sua `main` local está atualizada com a remota:
```bash
git checkout main
git pull origin main
```

### 2. Padrão para Criação de Branches
Crie sua branch a partir da `main` atualizada. O nome da branch deve seguir a estrutura:

`tipo-numeroTask/descricao-curta`

**Tipos válidos:** `feat` (funcionalidade), `fix` (correção de bug), `docs` (documentação), `refactor` (refatoração), `style` (formatação), `test` (testes).

**Exemplos:**
* `feat-78/add-users-model`
* `fix-102/login-error`
* `docs-15/update-readme`

```bash
git checkout -b feat-78/add-users-model
```

### 3. Padrão de Commits (Diferenciando Front e Back)
Como estamos em um monorepo, utilize **prefixos** nas mensagens de commit para identificar claramente o escopo do que foi alterado.

**Estrutura da Mensagem de Commit:**
`Tipo-NumeroTask (escopo): Descrição em imperativo`

**Exemplos por Escopo:**
* **Backend:** `Feat-78 (backend): add users model`
* **Frontend:** `Feat-78 (frontend): add login form UI`
* **Geral/Ambos:** `Feat-78 (monorepo): add docker setup`

**Comando:**
```bash
git commit -m "Feat-78 (backend): add users model"
```

### 4. Enviar Alterações (Push) e Pull Request (PR)
Envie sua branch para o repositório remoto:
```bash
git push -u origin feat-78/add-users-model
```
Após o push, acesse o GitHub e abra um **Pull Request (PR)** apontando a sua branch para a `main`. Peça para pelo menos uma outra pessoa revisar antes de aprovar o merge.

---

## 👥 Equipe
Projeto desenvolvido para a disciplina de Projeto Integrador Web.
