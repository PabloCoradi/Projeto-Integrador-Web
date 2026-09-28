import { useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import {
  atualizarCaso,
  criarCaso,
  inativarCaso,
  listarCasos,
} from "../../services/casos";

const FORM_VAZIO = {
  cliente_id: "",
  titulo: "",
  tipo_atendimento: "",
  observacoes: "",
};

function Casos() {
  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({ tipoAtendimento: "", q: "" });
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarCasos(filtrosAtuais = filtros) {
    setErro("");
    setCarregando(true);

    try {
      const dados = await listarCasos({
        tipoAtendimento: filtrosAtuais.tipoAtendimento.trim(),
        q: filtrosAtuais.q.trim(),
      });
      setCasos(dados);
    } catch (e) {
      setErro(e.message);
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
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }

    iniciar();
  }, []);

  function nomeDoCliente(clienteId) {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? cliente.nome : `Cliente #${clienteId}`;
  }

  function alterarForm(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function iniciarEdicao(caso) {
    setEditandoId(caso.id);
    setForm({
      cliente_id: String(caso.cliente_id),
      titulo: caso.titulo,
      tipo_atendimento: caso.tipo_atendimento,
      observacoes: caso.observacoes || "",
    });
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro("");
  }

  async function salvar(evento) {
    evento.preventDefault();
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
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function inativar(caso) {
    if (!window.confirm(`Inativar o caso "${caso.titulo}"?`)) return;

    setErro("");

    try {
      await inativarCaso(caso.id);

      if (editandoId === caso.id) cancelarEdicao();

      await carregarCasos();
    } catch (e) {
      setErro(e.message);
    }
  }

  function buscar(evento) {
    evento.preventDefault();
    carregarCasos();
  }

  function limparFiltros() {
    const vazio = { tipoAtendimento: "", q: "" };
    setFiltros(vazio);
    carregarCasos(vazio);
  }

    return (
    <div>
      <h1>Casos</h1>

      <p>Gerencie os casos e processos dos clientes.</p>

      {erro && (
        <div role="alert" className="error-message">
          {erro}
        </div>
      )}

      <div className="content-card cliente-form-card">
        <h2>{editandoId ? "Editar caso" : "Novo caso"}</h2>

        <form onSubmit={salvar}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="caso-cliente">Cliente</label>
              <select
                id="caso-cliente"
                value={form.cliente_id}
                onChange={(e) => alterarForm("cliente_id", e.target.value)}
                disabled={editandoId !== null}
                required
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="caso-tipo">Tipo de atendimento</label>
              <input
                id="caso-tipo"
                type="text"
                value={form.tipo_atendimento}
                onChange={(e) =>
                  alterarForm("tipo_atendimento", e.target.value)
                }
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="caso-titulo">Título</label>
              <input
                id="caso-titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => alterarForm("titulo", e.target.value)}
                minLength={2}
                maxLength={200}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="caso-obs">Observações</label>
              <textarea
                id="caso-obs"
                rows={4}
                value={form.observacoes}
                onChange={(e) => alterarForm("observacoes", e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            {editandoId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelarEdicao}
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              className="primary-button"
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
      </div>

      <div className="content-card">
        <h2 style={{ marginTop: 0, marginBottom: 24 }}>Casos cadastrados</h2>

        <form onSubmit={buscar} style={{ marginBottom: 24 }}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="filtro-q">Buscar</label>
              <input
                id="filtro-q"
                type="text"
                placeholder="Título ou observações"
                value={filtros.q}
                onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="filtro-tipo">Tipo de atendimento</label>
              <input
                id="filtro-tipo"
                type="text"
                placeholder="Igual ao cadastrado"
                value={filtros.tipoAtendimento}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipoAtendimento: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={limparFiltros}
            >
              Limpar
            </button>
            <button type="submit" className="primary-button">
              Buscar
            </button>
          </div>
        </form>

        {carregando ? (
          <p>Carregando...</p>
        ) : casos.length === 0 ? (
          <p>Nenhum caso encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
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
                    <td>{nomeDoCliente(caso.cliente_id)}</td>
                    <td>{caso.titulo}</td>
                    <td>{caso.tipo_atendimento}</td>
                    <td>{caso.observacoes}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(caso)}
                        >
                          Editar
                        </button>
                        <button type="button" onClick={() => inativar(caso)}>
                          Inativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Casos;