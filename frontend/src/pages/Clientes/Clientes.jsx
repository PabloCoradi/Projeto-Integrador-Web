import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    nome: "",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    observacoes: "",
  });

  const [salvando, setSalvando] = useState(false);

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

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function abrirFormulario() {
    setFormulario({
      nome: "",
      cpf_cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      observacoes: "",
    });

    setErro("");
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    if (salvando) {
      return;
    }

    setMostrarFormulario(false);
  }

  async function salvarCliente(event) {
    event.preventDefault();

    if (!formulario.nome.trim()) {
      setErro("O nome do cliente é obrigatório.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      await apiRequest("/api/clientes/", {
        method: "POST",
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          cpf_cnpj: formulario.cpf_cnpj.trim() || null,
          email: formulario.email.trim() || null,
          telefone: formulario.telefone.trim() || null,
          endereco: formulario.endereco.trim() || null,
          observacoes: formulario.observacoes.trim() || null,
        }),
      });

      setMostrarFormulario(false);

      await carregarClientes();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
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
          <h2>Novo Cliente</h2>

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
                  : "Salvar Cliente"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card">
        {carregando && (
          <p>Carregando clientes...</p>
        )}

        {!carregando && clientes.length === 0 && (
          <p>
            Nenhum cliente cadastrado.
          </p>
        )}

        {!carregando && clientes.length > 0 && (
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
              {clientes.map((cliente) => (
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
                    <button>
                      Editar
                    </button>
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