import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import {
  TAGS_PADRAO,
  alterarTagDocumento,
  enviarDocumento,
  gerarLinkDocumento,
  inativarDocumento,
  listarDocumentos,
  listarTagsUsadas,
} from "../../services/documentosClientes";
import { formatarData, formatarTamanho } from "../../utils/formatacao";
import { abrirEmNovaAba } from "../../utils/abrirEmNovaAba";
import { CampoTag, EtiquetaTag, FiltroTag } from "../../components/Tags";

// Deve ser igual ao TAMANHO_MAXIMO_MB do backend
const LIMITE_MB = 500;

function DocumentosCliente({ cliente, titulo, onFechar, onQuantidadeAlterada, somenteLeitura = false }) {
  const { podeEditar } = useAuth();
  // Cliente inativo: os documentos podem ser consultados, mas não alterados.
  const podeEditarClientes = podeEditar("clientes") && !somenteLeitura;

  const [documentos, setDocumentos] = useState([]);
  const [tagsUsadas, setTagsUsadas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tag, setTag] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [envio, setEnvio] = useState(null);

  const inputRef = useRef(null);
  // Só repassa a quantidade depois que a lista carregou com sucesso.
  const listaCarregadaRef = useRef(false);

  const carregar = useCallback(async () => {
    try {
      const [lista, tags] = await Promise.all([
        listarDocumentos(cliente.id),
        listarTagsUsadas().catch(() => []),
      ]);
      setDocumentos(lista);
      listaCarregadaRef.current = true;
      setTagsUsadas(tags);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [cliente.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Avisa a listagem para atualizar o contador do botão "Documentos".
  useEffect(() => {
    if (listaCarregadaRef.current) onQuantidadeAlterada?.(documentos.length);
  }, [documentos, onQuantidadeAlterada]);

  const sugestoes = useMemo(
    () => Array.from(new Set([...TAGS_PADRAO, ...tagsUsadas])),
    [tagsUsadas]
  );

  const tagsDoCliente = useMemo(
    () => Array.from(new Set(documentos.map((d) => d.tag))).sort(),
    [documentos]
  );

  const documentosFiltrados = filtroTag
    ? documentos.filter((d) => d.tag === filtroTag)
    : documentos;

  function escolherArquivos() {
    setErro("");
    inputRef.current?.click();
  }

  async function aoEscolherArquivos(evento) {
    const lista = Array.from(evento.target.files);
    evento.target.value = "";

    if (lista.length === 0 || !podeEditarClientes) return;

    const tagEscolhida = tag.trim();
    const falhas = [];

    setErro("");

    for (let i = 0; i < lista.length; i += 1) {
      const arquivo = lista[i];

      if (arquivo.size > LIMITE_MB * 1024 * 1024) {
        falhas.push(`${arquivo.name}: excede o limite de ${LIMITE_MB} MB.`);
        continue;
      }

      setEnvio({
        indice: i + 1,
        total: lista.length,
        nome: arquivo.name,
        percentual: 0,
      });

      try {
        await enviarDocumento(cliente.id, arquivo, tagEscolhida, (percentual) => {
          setEnvio((atual) => (atual ? { ...atual, percentual } : atual));
        });
      } catch (e) {
        falhas.push(`${arquivo.name}: ${e.message}`);
      }
    }

    setEnvio(null);

    if (falhas.length > 0) {
      setErro(falhas.join("\n"));
    } else {
      setTag("");
    }

    await carregar();
  }

  async function abrir(documento, inline) {
    setErro("");

    try {
      if (inline) {
        // Abrir: mostra o documento numa aba nova do navegador.
        await abrirEmNovaAba(async () => (
          await gerarLinkDocumento(cliente.id, documento.id, true)
        ).url);
      } else {
        const { url } = await gerarLinkDocumento(cliente.id, documento.id, false);
        window.open(url, "_blank", "noopener");
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  async function trocarTag(documento) {
    const nova = window.prompt(
      `Nova tag para "${documento.nome_original}":`,
      documento.tag
    );

    if (nova === null || !nova.trim() || nova.trim() === documento.tag) return;

    setErro("");

    try {
      await alterarTagDocumento(cliente.id, documento.id, nova.trim());
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function remover(documento) {
    const confirmou = window.confirm(
      `Remover o documento "${documento.nome_original}" (${documento.tag})?`
    );

    if (!confirmou) return;

    setErro("");

    try {
      await inativarDocumento(cliente.id, documento.id);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  const enviando = envio !== null;

  return (
    <section className="content-card cliente-form-card file-manager" aria-labelledby="documentos-cliente-titulo">
      <div className="file-manager__heading">
        <h2 id="documentos-cliente-titulo">{titulo || `Documentos de ${cliente.nome}`}</h2>

        {onFechar && (
          <button
            type="button"
            className="secondary-button"
            onClick={onFechar}
            disabled={enviando}
          >
            Fechar
          </button>
        )}
      </div>

      {erro && (
        <div
          role="alert"
          className="error-message file-manager__error"
        >
          {erro}
        </div>
      )}

      {somenteLeitura && (
        <div className="alert alert--warning" role="status">
          Este cliente está inativo. Os documentos estão disponíveis só para consulta.
          Para enviar, alterar ou excluir documentos, reative o cliente.
        </div>
      )}

      {podeEditarClientes && (
        <div className="file-manager__upload">
          <div className="file-manager__upload-controls">
            <CampoTag
              id="tag-documento"
              value={tag}
              onChange={setTag}
              sugestoes={sugestoes}
              disabled={enviando}
              placeholder="Ex.: CNH, IDENTIDADE, CPF..."
            />

            <input
              ref={inputRef}
              type="file"
              multiple
              aria-label="Selecionar documentos para anexar"
              onChange={aoEscolherArquivos}
              style={{ display: "none" }}
            />

            <button
              type="button"
              className="primary-button"
              onClick={escolherArquivos}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "+ Anexar documentos"}
            </button>
          </div>

          <p className="file-manager__help">
            Todos os arquivos selecionados recebem a tag escolhida. Se a tag
            ficar em branco, eles são salvos como <strong>OUTROS</strong>. Até{" "}
            {LIMITE_MB} MB cada. Esses documentos aparecem automaticamente nos
            casos deste cliente.
          </p>

          {enviando && (
            <div className="file-manager__progress-wrap" aria-live="polite">
              <p>
                Enviando {envio.indice} de {envio.total}: {envio.nome}
              </p>

              <div
                role="progressbar"
                aria-label="Progresso do envio de documentos"
                aria-valuenow={envio.percentual}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${envio.percentual}% concluído`}
                className="file-manager__progress"
              >
                <div
                  style={{
                    width: `${envio.percentual}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <FiltroTag
        id="filtro-tag-documento"
        tags={tagsDoCliente}
        value={filtroTag}
        onChange={setFiltroTag}
      />

      {carregando ? (
        <p>Carregando documentos...</p>
      ) : documentosFiltrados.length === 0 ? (
        <p>Nenhum documento anexado a este cliente.</p>
      ) : (
        <div className="table-scroll file-manager__table" role="region" aria-label="Documentos anexados" tabIndex={0}>
          <table className="data-table file-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Enviado em</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {documentosFiltrados.map((documento) => (
                <tr key={documento.id}>
                  <td>
                    <EtiquetaTag tag={documento.tag} />
                  </td>
                  <td className="file-table__name">
                    <button
                      type="button"
                      className="file-name-link"
                      onClick={() => abrir(documento, true)}
                      title="Abrir em uma nova aba"
                    >
                      {documento.nome_original}
                    </button>
                  </td>
                  <td>{formatarTamanho(documento.tamanho_bytes)}</td>
                  <td>{formatarData(documento.criado_em)}</td>
                  <td>
                    <div className="file-table__actions">
                      <button type="button" onClick={() => abrir(documento, true)}>
                        Abrir
                      </button>
                      <button type="button" onClick={() => abrir(documento, false)}>
                        Baixar
                      </button>
                      {podeEditarClientes && (
                        <>
                          <button type="button" onClick={() => trocarTag(documento)}>
                            Alterar tag
                          </button>
                          <button type="button" onClick={() => remover(documento)}>
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default DocumentosCliente;
