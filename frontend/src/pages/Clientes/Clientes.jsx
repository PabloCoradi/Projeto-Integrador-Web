import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { enviarFotoCliente, removerFotoCliente } from "../../services/clientes";
import { useAuth } from "../../contexts/AuthContext";
import BotaoArquivos from "../../components/BotaoArquivos";
import FiltroSituacao from "../../components/FiltroSituacao";

import FotoCliente from "./FotoCliente";
import { iniciaisCliente } from "./clienteUtils";
import "./Clientes.css";

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
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const inputFotoRef = useRef(null);
  const clienteEditado = clientes.find((cliente) => cliente.id === editandoId);
  const fotoPreview = useMemo(
    () => fotoSelecionada ? URL.createObjectURL(fotoSelecionada) : "",
    [fotoSelecionada]
  );

  useEffect(() => () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
  }, [fotoPreview]);

  const [situacao, setSituacao] = useState("ativos");
  const exibindoInativos = situacao === "inativos";

  const navigate = useNavigate();

  // Os documentos e os casos do cliente ficam na página dele.
  function abrirCliente(cliente) {
    navigate(`/clientes/${cliente.id}`);
  }

  async function carregarClientes(situacaoAtual = situacao) {
    try {
      setCarregando(true);
      setErro("");

      const dados = await apiRequest(`/api/clientes/?situacao=${situacaoAtual}`);
      setClientes(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarClientes(situacao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situacao]);

  function trocarSituacao(novaSituacao) {
    if (novaSituacao === situacao) return;
    setBusca("");
    setClientes([]);
    setSituacao(novaSituacao);
  }

  async function reativarCliente(cliente) {
    if (!podeEditarClientes) return;
    const confirmou = window.confirm(
      `Reativar o cliente "${cliente.nome}"? Ele volta a aparecer na lista de ativos.`
    );
    if (!confirmou) return;

    setErro("");
    try {
      await apiRequest(`/api/clientes/${cliente.id}/reativar`, { method: "PATCH" });
      await carregarClientes();
    } catch (error) {
      setErro(error.message);
    }
  }

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
    setFotoSelecionada(null);
    setRemoverFoto(false);
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
    setFotoSelecionada(null);
    setRemoverFoto(false);
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
    setFotoSelecionada(null);
    setRemoverFoto(false);
  }

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
      setErro("Escolha uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("A foto deve ter no máximo 5 MB.");
      return;
    }

    setErro("");
    setFotoSelecionada(arquivo);
    setRemoverFoto(false);
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

      const clienteSalvo = await apiRequest(
        editandoId
          ? "/api/clientes/" + editandoId
          : "/api/clientes/",
        {
          method: editandoId ? "PUT" : "POST",
          body: JSON.stringify(corpo),
        }
      );

      if (fotoSelecionada) {
        try {
          await enviarFotoCliente(clienteSalvo.id, fotoSelecionada);
        } catch (error) {
          setEditandoId(clienteSalvo.id);
          setErro(`Cliente salvo, mas a foto não foi enviada: ${error.message}`);
          await carregarClientes();
          return;
        }
      } else if (removerFoto && editandoId) {
        try {
          await removerFotoCliente(editandoId);
        } catch (error) {
          setErro(`Dados salvos, mas a foto não foi removida: ${error.message}`);
          await carregarClientes();
          return;
        }
      }

      setMostrarFormulario(false);
      setEditandoId(null);
      setFotoSelecionada(null);
      setRemoverFoto(false);

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
      'Inativar o cliente "' + cliente.nome + '"?\n\n' +
        "Os casos dele também vão para Casos > Inativos e voltam sozinhos quando o cliente for reativado."
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

        {podeEditarClientes && !mostrarFormulario && !exibindoInativos && (
          <button
            className="button button--primary"
            type="button"
            onClick={abrirFormulario}
          >
            Novo cliente
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
              {editandoId ? "Editar cliente" : "Novo cliente"}
            </h2>

            <p>
              {editandoId
                ? "Atualize os dados cadastrais do cliente selecionado."
                : "Preencha os dados abaixo para cadastrar um cliente."}
            </p>
          </div>

          <form onSubmit={salvarCliente}>
            <div className="client-photo-field">
              <div className="client-photo-field__preview" aria-hidden="true">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="" />
                ) : clienteEditado?.tem_foto && !removerFoto ? (
                  <FotoCliente cliente={clienteEditado} className="client-avatar--form" />
                ) : (
                  <span className="client-photo-field__initials">
                    {iniciaisCliente(formulario.nome) || "＋"}
                  </span>
                )}
              </div>
              <div className="client-photo-field__content">
                <strong>Foto do cliente</strong>
                <p>JPG, PNG ou WEBP. A imagem será ajustada automaticamente.</p>
                <small>Limite de 5 MB</small>
              </div>
              <input
                ref={inputFotoRef}
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selecionarFoto}
                aria-label="Selecionar foto do cliente"
              />
              <div className="client-photo-field__actions">
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={salvando}
                >
                  {(clienteEditado?.tem_foto && !removerFoto) || fotoSelecionada
                    ? "Trocar foto"
                    : "Adicionar foto"}
                </button>
                {(fotoSelecionada || (clienteEditado?.tem_foto && !removerFoto)) && (
                  <button
                    className="button button--quiet client-photo-field__remove"
                    type="button"
                    onClick={() => {
                      setFotoSelecionada(null);
                      setRemoverFoto(Boolean(clienteEditado?.tem_foto));
                    }}
                    disabled={salvando}
                  >
                    Remover
                  </button>
                )}
                {removerFoto && clienteEditado?.tem_foto && (
                  <button
                    className="button button--quiet"
                    type="button"
                    onClick={() => setRemoverFoto(false)}
                    disabled={salvando}
                  >
                    Manter foto
                  </button>
                )}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="nome">
                  Nome completo *
                </label>

                <input
                  id="nome"
                  name="nome"
                  autoComplete="name"
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
                  autoComplete="off"
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
                  autoComplete="email"
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
                  type="tel"
                  autoComplete="tel"
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
                  autoComplete="street-address"
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
                    : "Salvar cliente"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="surface data-panel">
        <div className="section-heading list-heading">
          <div>
            <h2>{exibindoInativos ? "Clientes inativos" : "Clientes cadastrados"}</h2>
            <p>
              {exibindoInativos
                ? "Clientes inativados ficam guardados aqui e podem ser reativados."
                : "Consulte os registros ativos e acesse as ações disponíveis."}
            </p>
          </div>
          <FiltroSituacao valor={situacao} onChange={trocarSituacao} rotulo="Mostrar clientes" />
        </div>
        {!carregando && clientes.length > 0 && (
          <div className="search-block">
            <div className="search-input">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                name="busca"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
                aria-label="Buscar clientes"
                autoComplete="off"
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
            {exibindoInativos ? "Nenhum cliente inativo." : "Nenhum cliente cadastrado."}
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state empty-state--compact">
            Nenhum cliente encontrado para a busca.
          </div>
        ) : (
          <div className="table-scroll" role="region" aria-label="Lista de clientes" tabIndex={0}>
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
                        <FotoCliente cliente={cliente} />

                        <Link
                          to={`/clientes/${cliente.id}`}
                          className="client-name-link"
                          title="Abrir a página do cliente"
                        >
                          {cliente.nome}
                        </Link>
                        {exibindoInativos && <span className="inactive-chip">Inativo</span>}
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
                      {exibindoInativos ? (
                        <span className="table-actions">
                          <BotaoArquivos
                            rotulo="Documentos"
                            quantidade={cliente.quantidade_documentos}
                            onClick={() => abrirCliente(cliente)}
                          />
                          {podeEditarClientes && (
                            <button type="button" className="text-action text-action--restore" onClick={() => reativarCliente(cliente)}>
                              Reativar
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="table-actions">
                          <BotaoArquivos
                            rotulo="Documentos"
                            quantidade={cliente.quantidade_documentos}
                            onClick={() => abrirCliente(cliente)}
                          />
                          {podeEditarClientes && (
                            <>
                              <button type="button" className="text-action" onClick={() => abrirEdicao(cliente)}>
                                Editar
                              </button>
                              <button type="button" className="text-action text-action--danger" onClick={() => inativarCliente(cliente)}>
                                Inativar
                              </button>
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

export default Clientes;
