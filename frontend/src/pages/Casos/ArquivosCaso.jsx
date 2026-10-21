import { useCallback, useEffect, useRef, useState } from "react";

import {
  enviarArquivo,
  gerarLinkArquivo,
  inativarArquivo,
  listarArquivos,
} from "../../services/casos";

// Deve ser igual ao TAMANHO_MAXIMO_MB do backend (arquivo_service.py)
const LIMITE_MB = 500;

function formatarTamanho(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const unidades = ["KB", "MB", "GB", "TB"];
  let valor = bytes / 1024;
  let indice = 0;

  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }

  return `${valor.toFixed(valor >= 10 ? 0 : 1)} ${unidades[indice]}`;
}

function formatarData(valor) {
  const temFuso = /Z$|[+-]\d{2}:\d{2}$/.test(valor);

  return new Date(temFuso ? valor : `${valor}Z`).toLocaleString("pt-BR");
}

function ArquivosCaso({ caso, onFechar }) {
  const [arquivos, setArquivos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [envio, setEnvio] = useState(null);

  const inputRef = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await listarArquivos(caso.id);
      setArquivos(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [caso.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aoEscolherArquivos(evento) {
    const lista = Array.from(evento.target.files);

    evento.target.value = "";

    if (lista.length === 0) {
      return;
    }

    setErro("");

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
        await enviarArquivo(caso.id, arquivo, (percentual) => {
          setEnvio((atual) => (atual ? { ...atual, percentual } : atual));
        });
      } catch (e) {
        falhas.push(`${arquivo.name}: ${e.message}`);
      }
    }

    setEnvio(null);

    if (falhas.length > 0) {
      setErro(falhas.join("\n"));
    }

    await carregar();
  }

  async function abrir(arquivo, inline) {
    setErro("");

    try {
      const { url } = await gerarLinkArquivo(caso.id, arquivo.id, inline);

      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function remover(arquivo) {
    const confirmou = window.confirm(
      `Remover o arquivo "${arquivo.nome_original}" deste caso?`
    );

    if (!confirmou) {
      return;
    }

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
        <h2 style={{ margin: 0 }}>Arquivos do caso: {caso.titulo}</h2>

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

      <div style={{ marginBottom: 24 }}>
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
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
        >
          {enviando ? "Enviando..." : "+ Anexar arquivos"}
        </button>

        <p style={{ marginTop: 8, fontSize: 13 }}>
          Qualquer tipo de arquivo (fotos, vídeos, áudios, documentos), até{" "}
          {LIMITE_MB} MB cada. Você pode selecionar vários de uma vez.
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

            <p style={{ marginTop: 6, fontSize: 13 }}>
              {envio.percentual < 100
                ? `${envio.percentual}%`
                : "Finalizando (salvando no armazenamento)..."}
            </p>
          </div>
        )}
      </div>

      {carregando ? (
        <p>Carregando arquivos...</p>
      ) : arquivos.length === 0 ? (
        <p>Nenhum arquivo anexado a este caso.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Enviado em</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {arquivos.map((arquivo) => (
                <tr key={arquivo.id}>
                  <td style={{ wordBreak: "break-word" }}>
                    {arquivo.nome_original}
                  </td>

                  <td>{formatarTamanho(arquivo.tamanho_bytes)}</td>

                  <td>{formatarData(arquivo.criado_em)}</td>

                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => abrir(arquivo, true)}>
                        Abrir
                      </button>

                      <button type="button" onClick={() => abrir(arquivo, false)}>
                        Baixar
                      </button>

                      <button type="button" onClick={() => remover(arquivo)}>
                        Remover
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
  );
}

export default ArquivosCaso;