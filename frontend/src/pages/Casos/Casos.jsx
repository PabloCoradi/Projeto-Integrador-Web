import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import BotaoArquivos from "../../components/BotaoArquivos";

import {
  atualizarCaso,
  criarCaso,
  inativarCaso,
  listarCasos,
} from "../../services/casos";

import ArquivosCaso from "./ArquivosCaso";

const FORM_VAZIO = {
  cliente_id: "",
  titulo: "",
  tipo_atendimento: "",
  observacoes: "",
};

function Casos() {
  const { podeEditar } = useAuth();
  const podeEditarCasos = podeEditar("casos");

  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [filtros, setFiltros] = useState({
    tipoAtendimento: "",
    q: "",
  });

  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [casoDosArquivos, setCasoDosArquivos] = useState(null);
  const painelArquivosRef = useRef(null);

  // Mantém o contador do botão "Arquivos" em dia após envios e exclusões.
  const idCasoDosArquivos = casoDosArquivos?.id;
  const atualizarQuantidadeArquivos = useCallback(
    (quantidade) => {
      setCasos((lista) =>
        lista.some((c) => c.id === idCasoDosArquivos && c.quantidade_arquivos !== quantidade)
          ? lista.map((c) =>
              c.id === idCasoDosArquivos ? { ...c, quantidade_arquivos: quantidade } : c
            )
          : lista
      );
    },
    [idCasoDosArquivos]
  );

  async function carregarCasos(filtrosAtuais = filtros) {
    setErro("");
    setCarregando(true);

    try {
      const lista = await listarCasos({
        tipoAtendimento: filtrosAtuais.tipoAtendimento.trim(),
        q: filtrosAtuais.q.trim(),
      });

      setCasos(lista);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    async function iniciar() {
      try {
        const [listaClientes, listaCasos] = await Promise.all([
          apiRequest("/api/clientes/"),
          listarCasos(),
        ]);

        setClientes(listaClientes);
        setCasos(listaCasos);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    iniciar();
  }, []);

  function nomeDoCliente(clienteId) {
    return (
      clientes.find((cliente) => cliente.id === clienteId)?.nome ||
      `Cliente #${clienteId}`
    );
  }

  function alterarForm(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function iniciarEdicao(caso) {
    if (!podeEditarCasos) return;

    setEditandoId(caso.id);

    setForm({
      cliente_id: String(caso.cliente_id),
      titulo: caso.titulo,
      tipo_atendimento: caso.tipo_atendimento,
      observacoes: caso.observacoes || "",
    });

    setErro("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro("");
  }

  async function salvar(evento) {
    evento.preventDefault();

    if (!podeEditarCasos) {
      setErro("Você não tem permissão para editar casos.");
      return;
    }

    setErro("");
    setSalvando(true);

    try {
      const observacoes = form.observacoes.trim() || null;

      if (editandoId) {
        await atualizarCaso(editandoId, {
          titulo: form.titulo,
          tipo_atendimento: form.tipo_atendimento,
          observacoes,
        });
      } else {
        await criarCaso({
          cliente_id: Number(form.cliente_id),
          titulo: form.titulo,
          tipo_atendimento: form.tipo_atendimento,
          observacoes,
        });
      }

      cancelarEdicao();
      await carregarCasos();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function inativar(caso) {
    if (!podeEditarCasos) return;

    const confirmou = window.confirm(
      `Inativar o caso "${caso.titulo}"?`
    );

    if (!confirmou) return;

    setErro("");

    try {
      await inativarCaso(caso.id);

      if (editandoId === caso.id) {
        cancelarEdicao();
      }

      if (casoDosArquivos?.id === caso.id) {
        setCasoDosArquivos(null);
      }

      await carregarCasos();
    } catch (error) {
      setErro(error.message);
    }
  }

  function abrirArquivos(caso) {
    setCasoDosArquivos(caso);

    setTimeout(() => {
      painelArquivosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function limparFiltros() {
    const vazio = {
      tipoAtendimento: "",
      q: "",
    };

    setFiltros(vazio);
    carregarCasos(vazio);
  }

  return (
    <div className="page page--cases">
      <header className="page-heading page-heading--action">
        <div>
          <h1>Casos</h1>

          <p>
            Cadastre, consulte e gerencie os casos vinculados aos clientes.
          </p>
        </div>

        <span className="status-label">
          CLIENTES ATIVOS
        </span>
      </header>

      {erro && (
        <div role="alert" className="alert alert--error">
          {erro}
        </div>
      )}

      {podeEditarCasos && (
        <section className="surface surface--accent form-panel">
          <div className="section-heading">
            <h2>
              {editandoId ? "Editar caso" : "Novo caso"}
            </h2>

            <p>
              {editandoId
                ? "Atualize as informações do caso. O cliente vinculado não pode ser alterado."
                : "Vincule o caso a um cliente ativo e registre as informações principais."}
            </p>
          </div>

          <form onSubmit={salvar}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="caso-cliente">
                  Cliente *
                </label>

                <select
                  id="caso-cliente"
                  value={form.cliente_id}
                  onChange={(event) =>
                    alterarForm("cliente_id", event.target.value)
                  }
                  disabled={editandoId !== null}
                  required
                >
                  <option value="">
                    Selecione um cliente ativo
                  </option>

                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="caso-tipo">
                  Tipo de atendimento *
                </label>

                <input
                  id="caso-tipo"
                  type="text"
                  value={form.tipo_atendimento}
                  onChange={(event) =>
                    alterarForm(
                      "tipo_atendimento",
                      event.target.value
                    )
                  }
                  placeholder="Ex.: Direito empresarial"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="caso-titulo">
                  Título *
                </label>

                <input
                  id="caso-titulo"
                  type="text"
                  value={form.titulo}
                  onChange={(event) =>
                    alterarForm("titulo", event.target.value)
                  }
                  placeholder="Informe o título do caso"
                  minLength={2}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-field form-field--wide">
                <label htmlFor="caso-obs">
                  Observações
                </label>

                <textarea
                  id="caso-obs"
                  rows={3}
                  value={form.observacoes}
                  onChange={(event) =>
                    alterarForm("observacoes", event.target.value)
                  }
                  placeholder="Adicione observações, se necessário."
                />

                <small>
                  Tipo: 2–100 caracteres • Título: 2–200 caracteres
                </small>
              </div>
            </div>

            <div className="form-actions form-actions--inline">
              {editandoId && (
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                className="button button--primary"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Cadastrar caso"}
              </button>
            </div>
          </form>
        </section>
      )}

      {casoDosArquivos && (
        <div ref={painelArquivosRef}>
          <ArquivosCaso
            key={casoDosArquivos.id}
            caso={casoDosArquivos}
            onFechar={() => setCasoDosArquivos(null)}
            onQuantidadeAlterada={atualizarQuantidadeArquivos}
          />
        </div>
      )}

      <section className="surface data-panel">
        <div className="section-heading">
          <h2>Casos cadastrados</h2>

          <p>
            Use os filtros e clique em Buscar para atualizar os resultados.
          </p>
        </div>

        <form
          className="filters-row"
          onSubmit={(evento) => {
            evento.preventDefault();
            carregarCasos();
          }}
        >
          <div className="form-field filters-row__search">
            <label htmlFor="filtro-q">
              Buscar título ou observações
            </label>

            <input
              id="filtro-q"
              type="text"
              placeholder="Digite um termo para pesquisar"
              value={filtros.q}
              onChange={(event) =>
                setFiltros({
                  ...filtros,
                  q: event.target.value,
                })
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="filtro-tipo">
              Tipo de atendimento
            </label>

            <input
              id="filtro-tipo"
              type="text"
              placeholder="Todos os tipos"
              value={filtros.tipoAtendimento}
              onChange={(event) =>
                setFiltros({
                  ...filtros,
                  tipoAtendimento: event.target.value,
                })
              }
            />
          </div>

          <div className="filters-row__actions">
            <button
              type="submit"
              className="button button--primary"
            >
              Buscar
            </button>

            <button
              type="button"
              className="button button--quiet"
              onClick={limparFiltros}
            >
              Limpar
            </button>
          </div>

          <small>
            Os filtros não são aplicados automaticamente.
          </small>
        </form>

        {carregando ? (
          <div className="empty-state empty-state--compact">
            Carregando casos...
          </div>
        ) : casos.length === 0 ? (
          <div className="empty-state empty-state--compact">
            Nenhum caso encontrado.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table cases-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {casos.map((caso) => (
                  <tr key={caso.id}>
                    <td>
                      <strong>
                        {nomeDoCliente(caso.cliente_id)}
                      </strong>
                    </td>

                    <td>{caso.titulo}</td>

                    <td>
                      <span className="type-chip">
                        {caso.tipo_atendimento}
                      </span>
                    </td>

                    <td>
                      {caso.observacoes || "—"}
                    </td>

                    <td>
                      <span className="table-actions">
                        <BotaoArquivos
                          rotulo="Arquivos"
                          quantidade={caso.quantidade_arquivos}
                          onClick={() => abrirArquivos(caso)}
                        />

                        {podeEditarCasos && (
                          <>
                            <button
                              type="button"
                              className="text-action"
                              onClick={() => iniciarEdicao(caso)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="text-action text-action--danger"
                              onClick={() => inativar(caso)}
                            >
                              Inativar
                            </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="stage-footer">
        ETAPA 03 / CASOS • CADASTRO E LISTAGEM
      </p>
    </div>
  );
}

export default Casos;