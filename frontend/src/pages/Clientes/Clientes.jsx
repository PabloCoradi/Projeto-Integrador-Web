import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api";

const FORMULARIO_VAZIO = {
  nome: "",
  cpf_cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  observacoes: "",
};

// Ignora maiúsculas/minúsculas e acentos ("joao" encontra "João")
function normalizar(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);

  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");

  async function carregarClientes() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await apiRequest("/api/clientes/");

      setClientes(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim());

    if (!termo) {
      return clientes;
    }

    const termoNumerico = termo.replace(/\D/g, "");

    return clientes.filter((cliente) => {
      const textos = [
        cliente.nome,
        cliente.email,
        cliente.telefone,
        cliente.cpf_cnpj,
      ]
        .map(normalizar)
        .join(" ");

      if (textos.includes(termo)) {
        return true;
      }

      // Permite buscar CPF/CNPJ e telefone sem pontuação
      if (termoNumerico) {
        const numeros = `${cliente.cpf_cnpj || ""}${cliente.telefone || ""}`.replace(
          /\D/g,
          ""
        );

        return numeros.includes(termoNumerico);
      }

      return false;
    });
  }, [clientes, busca]);

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function abrirFormulario() {
    setFormulario(FORMULARIO_VAZIO);
    setEditandoId(null);
    setErro("");
    setMostrarFormulario(true);
  }

  function abrirEdicao(cliente) {
    setFormulario({
      nome: cliente.nome || "",
      cpf_cnpj: cliente.cpf_cnpj || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      endereco: cliente.endereco || "",
      observacoes: cliente.observacoes || "",
    });

    setEditandoId(cliente.id);
    setErro("");
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharFormulario() {
    if (salvando) {
      return;
    }

    setMostrarFormulario(false);
    setEditandoId(null);
  }

  async function salvarCliente(event) {
    event.preventDefault();

    if (!formulario.nome.trim()) {
      setErro("O nome do cliente é obrigatório.");
      return;
    }

    const corpo = {
      nome: formulario.nome.trim(),
      cpf_cnpj: formulario.cpf_cnpj.trim() || null,
      email: formulario.email.trim() || null,
      telefone: formulario.telefone.trim() || null,
      endereco: formulario.endereco.trim() || null,
      observacoes: formulario.observacoes.trim() || null,
    };

    try {
      setSalvando(true);
      setErro("");

      if (editandoId) {
        await apiRequest(`/api/clientes/${editandoId}`, {
          method: "PUT",
          body: JSON.stringify(corpo),
        });
      } else {
        await apiRequest("/api/clientes/", {
          method: "POST",
          body: JSON.stringify(corpo),
        });
      }

      setMostrarFormulario(false);
      setEditandoId(null);

      await carregarClientes();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function inativarCliente(cliente) {
    const confirmou = window.confirm(
      `Inativar o cliente "${cliente.nome}"?`
    );

    if (!confirmou) {
      return;
    }

    try {
      setErro("");

      await apiRequest(`/api/clientes/${cliente.id}`, {
        method: "DELETE",
      });

      if (editandoId === cliente.id) {
        setMostrarFormulario(false);
        setEditandoId(null);
      }

      await carregarClientes();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Gerencie os clientes do escritório.</p>
        </div>

        <button
          className="primary-button"
          onClick={abrirFormulario}
        >
          + Novo Cliente
        </button>
      </div>

      {erro && (
        <div className="error-message">
          {erro}
        </div>
      )}

      {mostrarFormulario && (
        <div className="content-card cliente-form-card">
          <h2>
            {editandoId ? "Editar Cliente" : "Novo Cliente"}
          </h2>

          <form onSubmit={salvarCliente}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nome">
                  Nome *
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formulario.nome}
                  onChange={alterarCampo}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cpf_cnpj">
                  CPF/CNPJ
                </label>

                <input
                  id="cpf_cnpj"
                  name="cpf_cnpj"
                  type="text"
                  value={formulario.cpf_cnpj}
                  onChange={alterarCampo}
                  placeholder="CPF ou CNPJ"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={alterarCampo}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">
                  Telefone
                </label>

                <input
                  id="telefone"
                  name="telefone"
                  type="text"
                  value={formulario.telefone}
                  onChange={alterarCampo}
                  placeholder="(51) 99999-9999"
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="endereco">
                  Endereço
                </label>

                <input
                  id="endereco"
                  name="endereco"
                  type="text"
                  value={formulario.endereco}
                  onChange={alterarCampo}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="observacoes">
                  Observações
                </label>

                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={alterarCampo}
                  placeholder="Observações sobre o cliente"
                  rows="4"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={fecharFormulario}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar Alterações"
                    : "Salvar Cliente"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card">
        {!carregando && clientes.length > 0 && (
          <div className="form-group" style={{ marginBottom: 20 }}>
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone"
              aria-label="Buscar clientes"
            />
          </div>
        )}

        {carregando && (
          <p>Carregando clientes...</p>
        )}

        {!carregando && clientes.length === 0 && (
          <p>
            Nenhum cliente cadastrado.
          </p>
        )}

        {!carregando &&
          clientes.length > 0 &&
          clientesFiltrados.length === 0 && (
            <p>
              Nenhum cliente encontrado para a busca.
            </p>
          )}

        {!carregando && clientesFiltrados.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>

                  <td>
                    {cliente.cpf_cnpj || "-"}
                  </td>

                  <td>
                    {cliente.email || "-"}
                  </td>

                  <td>
                    {cliente.telefone || "-"}
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => abrirEdicao(cliente)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => inativarCliente(cliente)}
                      >
                        Inativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Clientes;