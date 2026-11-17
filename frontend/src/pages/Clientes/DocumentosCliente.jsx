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
import { CampoTag, EtiquetaTag, FiltroTag } from "../../components/Tags";

// Deve ser igual ao TAMANHO_MAXIMO_MB do backend
const LIMITE_MB = 500;

function DocumentosCliente({ cliente, onFechar }) {
  const { podeEditar } = useAuth();
  const podeEditarClientes = podeEditar("clientes");

  const [documentos, setDocumentos] = useState([]);
  const [tagsUsadas, setTagsUsadas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tag, setTag] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [envio, setEnvio] = useState(null);

  const inputRef = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const [lista, tags] = await Promise.all([
        listarDocumentos(cliente.id),
        listarTagsUsadas().catch(() => []),
      ]);
      setDocumentos(lista);
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
      const { url } = await gerarLinkDocumento(cliente.id, documento.id, inline);
      window.open(url, "_blank", "noopener");
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
    <div className="content-card cliente-form-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>Documentos de {cliente.nome}</h2>

        <button
          type="button"
          className="secondary-button"
          onClick={onFechar}
          disabled={enviando}
        >
          Fechar
        </button>
      </div>

      {erro && (
        <div
          role="alert"
          className="error-message"
          style={{ whiteSpace: "pre-line" }}
        >
          {erro}
        </div>
      )}

      {podeEditarClientes && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
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

          <p style={{ marginTop: 8, fontSize: 13 }}>
            Todos os arquivos selecionados recebem a tag escolhida. Se a tag
            ficar em branco, eles são salvos como <strong>OUTROS</strong>. Até{" "}
            {LIMITE_MB} MB cada. Esses documentos aparecem automaticamente nos
            casos deste cliente.
          </p>

          {enviando && (
            <div style={{ marginTop: 16 }}>
              <p>
                Enviando {envio.indice} de {envio.total}: {envio.nome}
              </p>

              <div
                role="progressbar"
                aria-valuenow={envio.percentual}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  height: 8,
                  marginTop: 8,
                  borderRadius: 4,
                  background: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${envio.percentual}%`,
                    height: "100%",
                    background: "#1f2937",
                    transition: "width 0.2s",
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
        <div style={{ overflowX: "auto" }}>
          <table>
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
                  <td style={{ wordBreak: "break-word" }}>
                    {documento.nome_original}
                  </td>
                  <td>{formatarTamanho(documento.tamanho_bytes)}</td>
                  <td>{formatarData(documento.criado_em)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
    </div>
  );
}

export default DocumentosCliente;
