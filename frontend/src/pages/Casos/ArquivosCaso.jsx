
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

import {
  TAGS_PADRAO_CASO,
  alterarTagArquivo,
  enviarArquivo,
  gerarLinkArquivo,
  inativarArquivo,
  listarArquivos,
} from "../../services/casos";
import {
  gerarLinkDocumentoDoCaso,
  listarDocumentosDoCaso,
} from "../../services/documentosClientes";
import { formatarData, formatarTamanho } from "../../utils/formatacao";
import { CampoTag, EtiquetaTag, FiltroTag } from "../../components/Tags";

// Deve ser igual ao TAMANHO_MAXIMO_MB do backend
const LIMITE_MB = 500;

function ArquivosCaso({ caso, onQuantidadeAlterada, somenteLeitura = false }) {
  const { podeEditar } = useAuth();
  // Caso inativo: os arquivos podem ser consultados, mas não alterados.
  const podeEditarCasos = podeEditar("casos") && !somenteLeitura;

  const [arquivos, setArquivos] = useState([]);
  const [documentosCliente, setDocumentosCliente] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [envio, setEnvio] = useState(null);
  const [tag, setTag] = useState("");
  const [filtroTag, setFiltroTag] = useState("");

  const inputRef = useRef(null);
  // Só repassa a quantidade depois que a lista carregou com sucesso.
  const listaCarregadaRef = useRef(false);

  const tagsDoCaso = useMemo(
    () => Array.from(new Set(arquivos.map((a) => a.tag))).sort(),
    [arquivos]
  );

  const sugestoes = useMemo(
    () => Array.from(new Set([...TAGS_PADRAO_CASO, ...tagsDoCaso])),
    [tagsDoCaso]
  );

  const arquivosFiltrados = filtroTag
    ? arquivos.filter((a) => a.tag === filtroTag)
    : arquivos;

  const carregar = useCallback(async () => {
    try {
      const [dados, documentos] = await Promise.all([
        listarArquivos(caso.id),
        listarDocumentosDoCaso(caso.id),
      ]);
      setArquivos(dados);
      listaCarregadaRef.current = true;
      setDocumentosCliente(documentos);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [caso.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Avisa a listagem para atualizar o contador do botão "Arquivos".
  useEffect(() => {
    if (listaCarregadaRef.current) onQuantidadeAlterada?.(arquivos.length);
  }, [arquivos, onQuantidadeAlterada]);

  async function aoEscolherArquivos(evento) {
    if (!podeEditarCasos) {
      setErro("Você não tem permissão para anexar arquivos.");
      evento.target.value = "";
      return;
    }

    const lista = Array.from(evento.target.files);
    evento.target.value = "";

    if (lista.length === 0) return;

    setErro("");

    const tagEscolhida = tag.trim();
    const falhas = [];

    for (let i = 0; i < lista.length; i += 1) {
      const arquivo = lista[i];

      if (arquivo.size > LIMITE_MB * 1024 * 1024) {
        falhas.push(
          `${arquivo.name}: excede o limite de ${LIMITE_MB} MB.`
        );
        continue;
      }

      setEnvio({
        indice: i + 1,
        total: lista.length,
        nome: arquivo.name,
        percentual: 0,
      });

      try {
        await enviarArquivo(caso.id, arquivo, tagEscolhida, (percentual) => {
          setEnvio((atual) =>
            atual ? { ...atual, percentual } : atual
          );
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

  async function trocarTag(arquivo) {
    const nova = window.prompt(
      `Nova tag para "${arquivo.nome_original}":`,
      arquivo.tag
    );

    if (nova === null || !nova.trim() || nova.trim() === arquivo.tag) return;

    setErro("");

    try {
      await alterarTagArquivo(caso.id, arquivo.id, nova.trim());
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function abrir(arquivo, inline) {
    setErro("");

    try {
      const { url } = await gerarLinkArquivo(
        caso.id,
        arquivo.id,
        inline
      );

      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function abrirDocumentoCliente(documento, inline) {
    setErro("");

    try {
      const { url } = await gerarLinkDocumentoDoCaso(
        caso.id,
        documento.id,
        inline
      );

      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function remover(arquivo) {
    if (!podeEditarCasos) {
      setErro("Você não tem permissão para remover arquivos.");
      return;
    }

    const confirmou = window.confirm(
      `Remover o arquivo "${arquivo.nome_original}" deste caso?`
    );

    if (!confirmou) return;

    setErro("");

    try {
      await inativarArquivo(caso.id, arquivo.id);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  const enviando = envio !== null;

  return (
    <section className="content-card cliente-form-card file-manager" aria-labelledby="arquivos-caso-titulo">
      <div className="file-manager__heading">
        <h2 id="arquivos-caso-titulo">
          Arquivos do caso: {caso.titulo}
        </h2>

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
          Este caso está inativo. Os arquivos estão disponíveis só para consulta.
          Para enviar, alterar ou excluir arquivos, reative o caso.
        </div>
      )}

      {podeEditarCasos && (
        <div className="file-manager__upload">
          <div className="file-manager__upload-controls">
            <CampoTag
              id="tag-arquivo-caso"
              value={tag}
              onChange={setTag}
              sugestoes={sugestoes}
              disabled={enviando}
              placeholder="Ex.: PETIÇÃO, CONTRATO, SENTENÇA..."
            />

            <input
              ref={inputRef}
              type="file"
              multiple
              aria-label="Selecionar arquivos para anexar"
              onChange={aoEscolherArquivos}
              style={{ display: "none" }}
            />

            <button
              type="button"
              className="primary-button"
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "+ Anexar documentos"}
            </button>
          </div>

          <p className="file-manager__help">
            Qualquer tipo de arquivo (fotos, vídeos, áudios, documentos),
            até {LIMITE_MB} MB cada. Você pode selecionar vários de uma vez;
            todos recebem a tag escolhida. Se a tag ficar em branco, eles são
            salvos como <strong>OUTROS</strong>.
          </p>

          {enviando && (
            <div className="file-manager__progress-wrap" aria-live="polite">
              <p>
                Enviando {envio.indice} de {envio.total}: {envio.nome}
              </p>

              <div
                role="progressbar"
                aria-label="Progresso do envio de arquivos"
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

              <p className="file-manager__progress-caption">
                {envio.percentual < 100
                  ? `${envio.percentual}%`
                  : "Finalizando (salvando no armazenamento)..."}
              </p>
            </div>
          )}
        </div>
      )}

      <FiltroTag
        id="filtro-tag-arquivo-caso"
        tags={tagsDoCaso}
        value={filtroTag}
        onChange={setFiltroTag}
      />

      {carregando ? (
        <p>Carregando arquivos...</p>
      ) : arquivosFiltrados.length === 0 ? (
        <p>Nenhum arquivo anexado a este caso.</p>
      ) : (
        <div className="table-scroll file-manager__table" role="region" aria-label="Arquivos anexados ao caso" tabIndex={0}>
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
              {arquivosFiltrados.map((arquivo) => (
                <tr key={arquivo.id}>
                  <td>
                    <EtiquetaTag tag={arquivo.tag} />
                  </td>

                  <td className="file-table__name">
                    {arquivo.nome_original}
                  </td>

                  <td>{formatarTamanho(arquivo.tamanho_bytes)}</td>

                  <td>{formatarData(arquivo.criado_em)}</td>

                  <td>
                    <div className="file-table__actions">
                      <button
                        type="button"
                        onClick={() => abrir(arquivo, true)}
                      >
                        Abrir
                      </button>

                      <button
                        type="button"
                        onClick={() => abrir(arquivo, false)}
                      >
                        Baixar
                      </button>

                      {podeEditarCasos && (
                        <>
                          <button
                            type="button"
                            onClick={() => trocarTag(arquivo)}
                          >
                            Alterar tag
                          </button>

                          <button
                            type="button"
                            onClick={() => remover(arquivo)}
                          >
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

      <h3 className="file-manager__related-title">Documentos do cliente</h3>

      <p className="file-manager__help file-manager__related-help">
        Puxados automaticamente do cadastro do cliente. Para incluir ou
        remover, use a aba Clientes.
      </p>

      {carregando ? (
        <p>Carregando documentos...</p>
      ) : documentosCliente.length === 0 ? (
        <p>O cliente deste caso não possui documentos anexados.</p>
      ) : (
        <div className="table-scroll file-manager__table" role="region" aria-label="Documentos do cliente" tabIndex={0}>
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
              {documentosCliente.map((documento) => (
                <tr key={documento.id}>
                  <td>
                    <EtiquetaTag tag={documento.tag} />
                  </td>

                  <td className="file-table__name">
                    {documento.nome_original}
                  </td>

                  <td>{formatarTamanho(documento.tamanho_bytes)}</td>

                  <td>{formatarData(documento.criado_em)}</td>

                  <td>
                    <div className="file-table__actions">
                      <button
                        type="button"
                        onClick={() => abrirDocumentoCliente(documento, true)}
                      >
                        Abrir
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirDocumentoCliente(documento, false)}
                      >
                        Baixar
                      </button>
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

export default ArquivosCaso;
