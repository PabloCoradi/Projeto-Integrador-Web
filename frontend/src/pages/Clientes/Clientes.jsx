import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import BotaoArquivos from "../../components/BotaoArquivos";

import DocumentosCliente from "./DocumentosCliente";

const FORMULARIO_VAZIO = {
  nome: "",
  cpf_cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  observacoes: "",
};

// Ignora maiúsculas, minúsculas e acentos nas buscas.
function normalizar(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterIniciais(nome) {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);

  return (
    (partes[0]?.[0] || "") +
    (partes[1]?.[0] || partes[0]?.[1] || "")
  ).toUpperCase();
}

function Clientes() {
  const { podeEditar } = useAuth();
  const podeEditarClientes = podeEditar("clientes");

  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  const [clienteDosDocumentos, setClienteDosDocumentos] = useState(null);
  const painelDocumentosRef = useRef(null);

  // Mantém o contador do botão "Documentos" em dia após envios e exclusões.
  const idClienteDosDocumentos = clienteDosDocumentos?.id;
  const atualizarQuantidadeDocumentos = useCallback(
    (quantidade) => {
      setClientes((lista) =>
        lista.some(
          (c) => c.id === idClienteDosDocumentos && c.quantidade_documentos !== quantidade
        )
          ? lista.map((c) =>
              c.id === idClienteDosDocumentos
                ? { ...c, quantidade_documentos: quantidade }
                : c
            )
          : lista
      );
    },
    [idClienteDosDocumentos]
  );

  function abrirDocumentos(cliente) {
    setClienteDosDocumentos(cliente);

    requestAnimationFrame(() => {
      painelDocumentosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

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

    if (!termo) return clientes;

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

      if (textos.includes(termo)) return true;

      if (!termoNumerico) return false;

      const numeros = (
        String(cliente.cpf_cnpj || "") +
        String(cliente.telefone || "")
      ).replace(/\D/g, "");

      return numeros.includes(termoNumerico);
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
    if (!podeEditarClientes) return;

    setFormulario(FORMULARIO_VAZIO);
    setEditandoId(null);
    setErro("");
    setMostrarFormulario(true);
  }

  function abrirEdicao(cliente) {
    if (!podeEditarClientes) return;

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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fecharFormulario() {
    if (salvando) return;

    setMostrarFormulario(false);
    setEditandoId(null);
  }

  async function salvarCliente(event) {
    event.preventDefault();

    if (!podeEditarClientes) {
      setErro("Você não tem permissão para editar clientes.");
      return;
    }

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

      await apiRequest(
        editandoId
          ? "/api/clientes/" + editandoId
          : "/api/clientes/",
        {
          method: editandoId ? "PUT" : "POST",
          body: JSON.stringify(corpo),
        }
      );

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
    if (!podeEditarClientes) return;

    const confirmou = window.confirm(
      'Inativar o cliente "' + cliente.nome + '"?'
    );

    if (!confirmou) return;

    try {
      setErro("");

      await apiRequest("/api/clientes/" + cliente.id, {
        method: "DELETE",
      });

      if (editandoId === cliente.id) {
        fecharFormulario();
      }

      if (clienteDosDocumentos?.id === cliente.id) {
        setClienteDosDocumentos(null);
      }

      await carregarClientes();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <div className="page page--clients">
      <header className="page-heading page-heading--action">
        <div>
          <h1>Clientes</h1>

          <p>
            Cadastre, consulte e mantenha atualizados os dados dos clientes.
          </p>
        </div>

        {podeEditarClientes && !mostrarFormulario && (
          <button
            className="button button--primary"
            type="button"
            onClick={abrirFormulario}
          >
            + Novo Cliente
          </button>
        )}
      </header>

      {erro && (
        <div className="alert alert--error" role="alert">
          {erro}
        </div>
      )}

      {mostrarFormulario && podeEditarClientes && (
        <section className="surface surface--accent form-panel">
          <div className="section-heading">
            <h2>
              {editandoId ? "Editar Cliente" : "Novo Cliente"}
            </h2>

            <p>
              {editandoId
                ? "Atualize os dados cadastrais do cliente selecionado."
                : "Preencha os dados abaixo para cadastrar um cliente."}
            </p>
          </div>

          <form onSubmit={salvarCliente}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="nome">
                  Nome completo *
                </label>

                <input
                  id="nome"
                  name="nome"
                  value={formulario.nome}
                  onChange={alterarCampo}
                  placeholder="Digite o nome completo"
                  maxLength={150}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="cpf_cnpj">
                  CPF/CNPJ
                </label>

                <input
                  id="cpf_cnpj"
                  name="cpf_cnpj"
                  value={formulario.cpf_cnpj}
                  onChange={alterarCampo}
                  placeholder="Digite o CPF ou CNPJ"
                  maxLength={20}
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={alterarCampo}
                  placeholder="exemplo@dominio.com"
                />
              </div>

              <div className="form-field">
                <label htmlFor="telefone">
                  Telefone
                </label>

                <input
                  id="telefone"
                  name="telefone"
                  value={formulario.telefone}
                  onChange={alterarCampo}
                  placeholder="(00) 00000-0000"
                  maxLength={30}
                />
              </div>

              <div className="form-field">
                <label htmlFor="endereco">
                  Endereço
                </label>

                <input
                  id="endereco"
                  name="endereco"
                  value={formulario.endereco}
                  onChange={alterarCampo}
                  placeholder="Rua, número, bairro e cidade"
                  maxLength={255}
                />
              </div>

              <div className="form-field">
                <label htmlFor="observacoes">
                  Observações
                </label>

                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={alterarCampo}
                  placeholder="Informações complementares"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button button--quiet"
                onClick={fecharFormulario}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="button button--primary"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Salvar Cliente"}
              </button>
            </div>
          </form>
        </section>
      )}

      {clienteDosDocumentos && (
        <div ref={painelDocumentosRef}>
          <DocumentosCliente
            key={clienteDosDocumentos.id}
            cliente={clienteDosDocumentos}
            onFechar={() => setClienteDosDocumentos(null)}
            onQuantidadeAlterada={atualizarQuantidadeDocumentos}
          />
        </div>
      )}

      <section className="surface data-panel">
        <div className="section-heading">
          <h2>Clientes cadastrados</h2>

          <p>
            Consulte os registros ativos e acesse as ações disponíveis.
          </p>
        </div>
        {!carregando && clientes.length > 0 && (
          <div className="search-block">
            <div className="search-input">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
                aria-label="Buscar clientes"
              />
            </div>

            <small>
              A lista é filtrada automaticamente enquanto você digita.
            </small>
          </div>
        )}

        {carregando ? (
          <div className="empty-state empty-state--compact">
            Carregando clientes...
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-state empty-state--compact">
            Nenhum cliente cadastrado.
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state empty-state--compact">
            Nenhum cliente encontrado para a busca.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table clients-table">
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
                    <td>
                      <span className="person-cell">
                        <span className="person-avatar">
                          {obterIniciais(cliente.nome)}
                        </span>

                        <strong>
                          {cliente.nome}
                        </strong>
                      </span>
                    </td>

                    <td>
                      {cliente.cpf_cnpj || "—"}
                    </td>

                    <td>
                      {cliente.email || "—"}
                    </td>

                    <td>
                      {cliente.telefone || "—"}
                    </td>

                    <td>
                      <span className="table-actions">
                        <BotaoArquivos
                          rotulo="Documentos"
                          quantidade={cliente.quantidade_documentos}
                          onClick={() => abrirDocumentos(cliente)}
                        />

                        {podeEditarClientes && (
                          <>
                            <button
                              type="button"
                              className="text-action"
                              onClick={() => abrirEdicao(cliente)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="text-action text-action--danger"
                              onClick={() => inativarCliente(cliente)}
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
        ETAPA 02 / CLIENTES • LISTAGEM E CADASTRO
      </p>
    </div>
  );
}

export default Clientes;
