import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import BotaoArquivos from "../../components/BotaoArquivos";
import FiltroSituacao from "../../components/FiltroSituacao";

import {
  atualizarCaso,
  criarCaso,
  enviarFotoCaso,
  inativarCaso,
  removerFotoCaso,
  listarCasos,
  reativarCaso,
} from "../../services/casos";

import ArquivosCaso from "./ArquivosCaso";
import FotoCaso from "./FotoCaso";
import { iniciaisCliente } from "./fotoCasoUtils";
import "./Casos.css";

const FORM_VAZIO = {
  cliente_id: "",
  titulo: "",
  tipo_atendimento: "",
  observacoes: "",
};

const TIPOS_FOTO_CASO = "image/jpeg,image/png,image/webp";
const LIMITE_FOTO_CASO_MB = 5;

function Casos() {
  const { podeEditar } = useAuth();
  const podeEditarCasos = podeEditar("casos");

  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formAberto, setFormAberto] = useState(false);

  const [filtros, setFiltros] = useState({
    tipoAtendimento: "",
    q: "",
  });

  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [removerFotoExistente, setRemoverFotoExistente] = useState(false);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [casoDosArquivos, setCasoDosArquivos] = useState(null);
  const painelArquivosRef = useRef(null);
  const fotoInputRef = useRef(null);

  const previaFotoLocal = useMemo(
    () => fotoSelecionada ? URL.createObjectURL(fotoSelecionada) : "",
    [fotoSelecionada]
  );

  useEffect(() => () => {
    if (previaFotoLocal) URL.revokeObjectURL(previaFotoLocal);
  }, [previaFotoLocal]);

  const [situacao, setSituacao] = useState("ativos");
  const exibindoInativos = situacao === "inativos";
  const idCasoDosArquivos = casoDosArquivos?.id;
  const atualizarQuantidadeArquivos = useCallback((quantidade) => {
    setCasos((lista) => lista.map((caso) =>
      caso.id === idCasoDosArquivos
        ? { ...caso, quantidade_arquivos: quantidade }
        : caso
    ));
  }, [idCasoDosArquivos]);

  async function carregarCasos(filtrosAtuais = filtros, situacaoAtual = situacao) {
    setErro("");
    setCarregando(true);

    try {
      const lista = await listarCasos({
        tipoAtendimento: filtrosAtuais.tipoAtendimento.trim(),
        q: filtrosAtuais.q.trim(),
        situacao: situacaoAtual,
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

  function nomeDoCliente(clienteId, nomeDoCaso = "") {
    return (
      nomeDoCaso ||
      clientes.find((cliente) => cliente.id === clienteId)?.nome ||
      `Cliente #${clienteId}`
    );
  }

  function dadosDoCliente(clienteId) {
    return clientes.find((cliente) => cliente.id === clienteId);
  }

  function trocarSituacao(novaSituacao) {
    if (novaSituacao === situacao) return;
    setCasoDosArquivos(null);
    setFormAberto(false);
    setCasos([]);
    setSituacao(novaSituacao);
    carregarCasos(filtros, novaSituacao);
  }

  async function reativar(caso) {
    if (!podeEditarCasos) return;
    const confirmou = window.confirm(
      `Reativar o caso "${caso.titulo}"? Ele volta a aparecer na lista de ativos.`
    );
    if (!confirmou) return;

    setErro("");
    try {
      await reativarCaso(caso.id);
      setCasoDosArquivos(null);
      await carregarCasos();
    } catch (error) {
      setErro(error.message);
    }
  }

  async function inativar(caso) {
    if (!podeEditarCasos) return;
    const confirmou = window.confirm(`Inativar o caso "${caso.titulo}"?`);
    if (!confirmou) return;

    setErro("");
    try {
      await inativarCaso(caso.id);
      setCasoDosArquivos(null);
      await carregarCasos();
    } catch (error) {
      setErro(error.message);
    }
  }

  function alterarForm(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function iniciarEdicao(caso) {
    if (!podeEditarCasos) return;

    setFormAberto(true);
    setEditandoId(caso.id);
    setFotoSelecionada(null);
    setRemoverFotoExistente(false);

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
    setFormAberto(false);
    setFotoSelecionada(null);
    setRemoverFotoExistente(false);
  }

  function escolherFoto(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    if (!TIPOS_FOTO_CASO.split(",").includes(arquivo.type)) {
      setErro("Formato não aceito. Escolha uma foto JPG, PNG ou WEBP.");
      return;
    }

    if (arquivo.size > LIMITE_FOTO_CASO_MB * 1024 * 1024) {
      setErro(`A foto precisa ter no máximo ${LIMITE_FOTO_CASO_MB} MB.`);
      return;
    }

    setErro("");
    setFotoSelecionada(arquivo);
    setRemoverFotoExistente(false);
  }

  function retirarFotoSelecionada() {
    setFotoSelecionada(null);
    if (editandoId && casoDosArquivos?.tem_foto) {
      setRemoverFotoExistente(true);
    } else {
      setRemoverFotoExistente(false);
    }
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

      const idEditado = editandoId;
      let casoSalvo;

      if (idEditado) {
        casoSalvo = await atualizarCaso(idEditado, {
          titulo: form.titulo,
          tipo_atendimento: form.tipo_atendimento,
          observacoes,
        });
      } else {
        casoSalvo = await criarCaso({
          cliente_id: Number(form.cliente_id),
          titulo: form.titulo,
          tipo_atendimento: form.tipo_atendimento,
          observacoes,
        });
      }

      try {
        if (fotoSelecionada) {
          casoSalvo = await enviarFotoCaso(casoSalvo.id, fotoSelecionada);
        } else if (idEditado && removerFotoExistente) {
          casoSalvo = await removerFotoCaso(casoSalvo.id);
        }
      } catch (errorFoto) {
        if (!idEditado) {
          setCasoDosArquivos(casoSalvo);
          setEditandoId(casoSalvo.id);
          setForm((atual) => ({ ...atual, cliente_id: String(casoSalvo.cliente_id) }));
        } else {
          setCasoDosArquivos(casoSalvo);
        }
        await carregarCasos();
        setErro(`Os dados do caso foram salvos, mas a foto não foi atualizada: ${errorFoto.message}`);
        return;
      }

      if (idEditado) setCasoDosArquivos(casoSalvo);

      cancelarEdicao();
      await carregarCasos();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  function abrirArquivos(caso) {
    setFormAberto(false);
    setCasoDosArquivos(caso);

    setTimeout(() => {
      painelArquivosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function abrirAnexos() {
    painelArquivosRef.current?.querySelector('input[type="file"]')?.click();
  }

  function voltarParaCasos() {
    cancelarEdicao();
    setCasoDosArquivos(null);
  }

  function limparFiltros() {
    const vazio = {
      tipoAtendimento: "",
      q: "",
    };

    setFiltros(vazio);
    carregarCasos(vazio);
  }

  const clienteDoCaso = casoDosArquivos
    ? dadosDoCliente(casoDosArquivos.cliente_id)
    : null;

  return (
    <div className="page page--cases">
      {!casoDosArquivos && (
      <header className="page-heading page-heading--action">
        <div>
          <h1>Casos</h1>

          <p>Organize os atendimentos, documentos e informações de cada cliente.</p>
        </div>

        {podeEditarCasos && !exibindoInativos && (
          <button
            type="button"
            className="button button--primary cases-create-button"
            onClick={() => {
              if (formAberto) cancelarEdicao();
              else setFormAberto(true);
            }}
            aria-expanded={formAberto}
            aria-controls="formulario-caso"
          >
            <span aria-hidden="true">{formAberto ? "−" : "+"}</span>
            {formAberto ? "Fechar formulário" : "Criar caso"}
          </button>
        )}
      </header>
      )}

      {erro && (
        <div role="alert" className="alert alert--error">
          {erro}
        </div>
      )}

      {podeEditarCasos && formAberto && (
        <section id="formulario-caso" className="surface surface--accent form-panel cases-form-panel">
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
            <div className="case-photo-field">
              <div className="case-photo-field__preview" aria-hidden="true">
                {previaFotoLocal ? (
                  <img src={previaFotoLocal} alt="" />
                ) : editandoId && casoDosArquivos?.tem_foto && !removerFotoExistente ? (
                  <FotoCaso
                    key={`${casoDosArquivos.id}-${casoDosArquivos.atualizado_em}`}
                    caso={casoDosArquivos}
                    nome={nomeDoCliente(casoDosArquivos.cliente_id, casoDosArquivos.cliente_nome)}
                  />
                ) : (
                  <span>{iniciaisCliente(nomeDoCliente(Number(form.cliente_id)))}</span>
                )}
              </div>
              <div className="case-photo-field__content">
                <div>
                  <strong>Foto da pasta</strong>
                  <p>Identifique o cliente com uma foto. JPG, PNG ou WEBP, até {LIMITE_FOTO_CASO_MB} MB.</p>
                  {fotoSelecionada && <small>{fotoSelecionada.name}</small>}
                  {removerFotoExistente && <small>A foto atual será removida ao salvar.</small>}
                </div>
                <input
                  ref={fotoInputRef}
                  id="caso-foto"
                  type="file"
                  accept={TIPOS_FOTO_CASO}
                  onChange={escolherFoto}
                  hidden
                />
                <div className="case-photo-field__actions">
                  <button
                    type="button"
                    className="button button--quiet"
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={salvando}
                  >
                    {fotoSelecionada || (casoDosArquivos?.tem_foto && !removerFotoExistente) ? "Trocar foto" : "Adicionar foto"}
                  </button>
                  {(fotoSelecionada || (editandoId && casoDosArquivos?.tem_foto && !removerFotoExistente)) && (
                    <button
                      type="button"
                      className="button button--quiet case-photo-field__remove"
                      onClick={retirarFotoSelecionada}
                      disabled={salvando}
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

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
          <section className="case-detail" aria-labelledby="case-detail-title">
            <div className="case-detail__intro">
              <FotoCaso
                key={`${casoDosArquivos.id}-${casoDosArquivos.atualizado_em}`}
                caso={casoDosArquivos}
                nome={nomeDoCliente(casoDosArquivos.cliente_id, casoDosArquivos.cliente_nome)}
                className="case-photo--detail"
              />
              <div>
                <p className="case-detail__eyebrow">{nomeDoCliente(casoDosArquivos.cliente_id, casoDosArquivos.cliente_nome)}</p>
                <h2 id="case-detail-title">{casoDosArquivos.titulo}</h2>
                <p>{casoDosArquivos.tipo_atendimento}</p>
              </div>
            </div>
            <div className="case-detail__actions">
              {podeEditarCasos && casoDosArquivos.ativo && (
                <>
                  <button type="button" className="button button--quiet" onClick={() => iniciarEdicao(casoDosArquivos)}>
                    Editar caso
                  </button>
                  <button type="button" className="button button--primary" onClick={abrirAnexos}>
                    Anexar documento
                  </button>
                </>
              )}
              <button type="button" className="button button--quiet" onClick={voltarParaCasos}>
                Voltar para casos
              </button>
            </div>
            <dl className="case-detail__client-info">
              <div><dt>CPF/CNPJ</dt><dd>{clienteDoCaso?.cpf_cnpj || "Não informado"}</dd></div>
              <div><dt>E-mail</dt><dd>{clienteDoCaso?.email || "Não informado"}</dd></div>
              <div><dt>Telefone</dt><dd>{clienteDoCaso?.telefone || "Não informado"}</dd></div>
              <div><dt>Endereço</dt><dd>{clienteDoCaso?.endereco || "Não informado"}</dd></div>
              {clienteDoCaso?.observacoes && (
                <div className="case-detail__client-notes"><dt>Observações do cliente</dt><dd>{clienteDoCaso.observacoes}</dd></div>
              )}
              {casoDosArquivos.observacoes && (
                <div className="case-detail__client-notes"><dt>Informações do caso</dt><dd>{casoDosArquivos.observacoes}</dd></div>
              )}
            </dl>
          </section>
          <ArquivosCaso
            key={casoDosArquivos.id}
            caso={casoDosArquivos}
            onQuantidadeAlterada={atualizarQuantidadeArquivos}
            somenteLeitura={!casoDosArquivos.ativo}
          />
        </div>
      )}

      {!casoDosArquivos && <section className="cases-browser" aria-labelledby="casos-cadastrados-titulo">
        <div className="cases-browser__heading">
          <div>
            <h2 id="casos-cadastrados-titulo">
              {exibindoInativos ? "Casos inativos" : "Seus casos"}
            </h2>
            <p>
              {exibindoInativos
                ? "Casos inativados ficam guardados aqui e podem ser reativados."
                : "Selecione uma pasta para consultar os dados e documentos do atendimento."}
            </p>
          </div>
          <div className="cases-browser__tools">
            <FiltroSituacao valor={situacao} onChange={trocarSituacao} rotulo="Mostrar casos" />
            <span className="cases-browser__count">
              {casos.length} {casos.length === 1 ? "caso" : "casos"}
            </span>
          </div>
        </div>

        <form
          className="filters-row cases-filters"
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
              name="q"
              type="text"
              autoComplete="off"
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
              name="tipo_atendimento"
              type="text"
              autoComplete="off"
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
            {exibindoInativos ? "Nenhum caso inativo encontrado." : "Nenhum caso encontrado."}
          </div>
        ) : (
          <div className="cases-grid" role="list" aria-label="Casos cadastrados">
            {casos.map((caso) => {
              const nomeCliente = nomeDoCliente(caso.cliente_id, caso.cliente_nome);
              return (
                <article className="case-folder" key={caso.id} role="listitem">
                  <div className="case-folder__topline">
                    <FotoCaso
                      key={`${caso.id}-${caso.atualizado_em}`}
                      caso={caso}
                      nome={nomeCliente}
                      className="case-photo--card"
                    />
                    <div className="case-folder__identity">
                      <span>Cliente</span>
                      <strong>{nomeCliente}</strong>
                    </div>
                  </div>
                  <div className="case-folder__body">
                    <div className="case-folder__meta">
                      <span className="case-folder__type">{caso.tipo_atendimento}</span>
                      {exibindoInativos && <span className="inactive-chip">Inativo</span>}
                    </div>
                    <h3 className="case-folder__title">{caso.titulo}</h3>
                    <div className="case-folder__actions">
                      <BotaoArquivos
                        rotulo="Arquivos"
                        quantidade={caso.quantidade_arquivos}
                        onClick={() => abrirArquivos(caso)}
                      />
                      {exibindoInativos ? (
                        podeEditarCasos && (
                          <button type="button" className="text-action text-action--restore" onClick={() => reativar(caso)}>
                            Reativar
                          </button>
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            className="case-folder__open"
                            onClick={() => abrirArquivos(caso)}
                            aria-label={`Abrir caso ${caso.titulo}, cliente ${nomeCliente}`}
                          >
                            Abrir pasta <span aria-hidden="true">↗</span>
                          </button>
                          {podeEditarCasos && (
                            <>
                              <button type="button" className="text-action" onClick={() => iniciarEdicao(caso)}>Editar</button>
                              <button type="button" className="text-action text-action--danger" onClick={() => inativar(caso)}>Inativar</button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}


      </section>}

    </div>
  );
}

export default Casos;
