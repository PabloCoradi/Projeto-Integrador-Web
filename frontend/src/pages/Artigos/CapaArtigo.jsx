import { useEffect, useRef, useState } from "react";

import {
  LIMITE_IMAGEM_MB,
  TIPOS_IMAGEM,
  enviarImagem,
  listarImagensEnviadas,
  listarImagensPadrao,
  removerImagem,
  urlDaImagem,
} from "../../services/imagensArtigos";

const CHAVE_AUTOMATICA = "geral";

/** Mesma regra do backend: imagem enviada > imagem padrão > imagem geral. */
export function urlDaCapa({ imagem_id: imagemId, imagem_padrao: imagemPadrao }) {
  if (imagemId) return urlDaImagem(`/api/public/imagens-artigos/${imagemId}`);

  return urlDaImagem(
    `/api/public/imagens-artigos/padrao/${imagemPadrao || CHAVE_AUTOMATICA}`
  );
}

const ABAS = [
  { id: "padrao", rotulo: "Imagens padrão" },
  { id: "enviadas", rotulo: "Já enviadas" },
  { id: "computador", rotulo: "Do computador" },
];

function CapaArtigo({ campos, onChange, disabled }) {
  const { imagem_id: imagemId, imagem_padrao: imagemPadrao, imagem_alt: imagemAlt } = campos;

  const [padroes, setPadroes] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState("padrao");
  const [progresso, setProgresso] = useState(null);
  const [erro, setErro] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    let ativo = true;

    Promise.all([listarImagensPadrao(), listarImagensEnviadas()])
      .then(([listaPadrao, listaEnviadas]) => {
        if (!ativo) return;
        setPadroes(listaPadrao);
        setEnviadas(listaEnviadas);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function escolher(capa) {
    setErro("");
    onChange(capa);
    setAberto(false);
  }

  function descricaoAtual() {
    if (imagemId) {
      const imagem = enviadas.find((i) => i.id === imagemId);
      return imagem ? `Imagem enviada: ${imagem.nome_original}` : "Imagem enviada";
    }

    const padrao = padroes.find((p) => p.chave === (imagemPadrao || CHAVE_AUTOMATICA));
    const nome = padrao ? padrao.titulo : "Justiça (geral)";

    return imagemPadrao ? `Imagem padrão: ${nome}` : `Automática: ${nome}`;
  }

  async function aoEscolherArquivo(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = "";

    if (!arquivo) return;

    setErro("");

    if (!TIPOS_IMAGEM.split(",").includes(arquivo.type)) {
      setErro("Formato não aceito. Envie uma imagem JPG, PNG ou WEBP.");
      return;
    }

    if (arquivo.size > LIMITE_IMAGEM_MB * 1024 * 1024) {
      setErro(`A imagem excede o limite de ${LIMITE_IMAGEM_MB} MB.`);
      return;
    }

    try {
      setProgresso(0);
      const imagem = await enviarImagem(arquivo, setProgresso);
      setEnviadas((atuais) => [imagem, ...atuais]);
      escolher({ imagem_id: imagem.id, imagem_padrao: null });
      setAba("enviadas");
    } catch (e) {
      setErro(e.message);
    } finally {
      setProgresso(null);
    }
  }

  async function remover(imagem) {
    if (!window.confirm(`Remover "${imagem.nome_original}" da galeria?`)) return;

    setErro("");

    try {
      await removerImagem(imagem.id);
      setEnviadas((atuais) => atuais.filter((i) => i.id !== imagem.id));

      if (imagemId === imagem.id) {
        onChange({ imagem_id: null, imagem_padrao: null });
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  const enviando = progresso !== null;
  const bloqueado = disabled || enviando;

  return (
    <section className="artigo-capa" aria-labelledby="artigo-capa-titulo">
      <span id="artigo-capa-titulo" className="artigo-capa__titulo">
        Imagem de capa
      </span>

      <div className="artigo-capa__atual">
        <img src={urlDaCapa(campos)} alt="" />

        <div className="artigo-capa__info">
          <strong>{descricaoAtual()}</strong>

          <div className="artigo-capa__botoes">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAberto((valor) => !valor)}
              disabled={bloqueado}
              aria-expanded={aberto}
            >
              {aberto ? "Fechar opções" : "Trocar imagem"}
            </button>

            {(imagemId || imagemPadrao) && (
              <button
                type="button"
                className="artigo-capa__link"
                onClick={() => escolher({ imagem_id: null, imagem_padrao: null })}
                disabled={bloqueado}
              >
                Usar a automática
              </button>
            )}
          </div>
        </div>
      </div>

      {erro && (
        <div className="error-message" role="alert">
          {erro}
        </div>
      )}

      {aberto && (
        <div className="artigo-capa__seletor">
          <div className="artigo-capa__abas" role="tablist" aria-label="Origem da imagem">
            {ABAS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={aba === item.id}
                className={aba === item.id ? "ativa" : ""}
                onClick={() => setAba(item.id)}
              >
                {item.rotulo}
              </button>
            ))}
          </div>

          {aba === "padrao" && (
            <ul className="artigo-capa__grade">
              {padroes.map((imagem) => (
                <li key={imagem.chave}>
                  <button
                    type="button"
                    className="artigo-capa__opcao"
                    aria-pressed={!imagemId && imagemPadrao === imagem.chave}
                    onClick={() => escolher({ imagem_id: null, imagem_padrao: imagem.chave })}
                  >
                    <img src={urlDaImagem(imagem.url)} alt="" loading="lazy" />
                    <span>{imagem.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {aba === "enviadas" &&
            (enviadas.length === 0 ? (
              <p className="artigo-capa__vazio">
                Nenhuma imagem enviada ainda. Use a aba “Do computador”.
              </p>
            ) : (
              <ul className="artigo-capa__grade">
                {enviadas.map((imagem) => (
                  <li key={imagem.id}>
                    <button
                      type="button"
                      className="artigo-capa__opcao"
                      aria-pressed={imagemId === imagem.id}
                      onClick={() => escolher({ imagem_id: imagem.id, imagem_padrao: null })}
                    >
                      <img src={urlDaImagem(imagem.url)} alt="" loading="lazy" />
                      <span>{imagem.nome_original}</span>
                    </button>
                    <button
                      type="button"
                      className="artigo-capa__remover"
                      onClick={() => remover(imagem)}
                      aria-label={`Remover ${imagem.nome_original} da galeria`}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {aba === "computador" && (
            <div className="artigo-capa__envio">
              <input
                ref={inputRef}
                type="file"
                accept={TIPOS_IMAGEM}
                onChange={aoEscolherArquivo}
                hidden
              />

              <button
                type="button"
                className="primary-button"
                onClick={() => inputRef.current?.click()}
                disabled={bloqueado}
              >
                {enviando ? `Enviando… ${progresso}%` : "Escolher imagem do computador"}
              </button>

              <small>
                JPG, PNG ou WEBP, até {LIMITE_IMAGEM_MB} MB. A imagem é reduzida
                automaticamente e fica guardada em “Já enviadas” para usar em
                outros artigos.
              </small>
            </div>
          )}
        </div>
      )}

      <label className="artigos-campo">
        <span>Descrição da imagem</span>
        <input
          value={imagemAlt}
          onChange={(e) => onChange({ imagem_alt: e.target.value })}
          maxLength={255}
          placeholder="Ex.: Família reunida na sala de casa"
          disabled={disabled}
        />
        <small>
          Lida por quem usa leitor de tela. Em branco, as imagens padrão usam uma
          descrição própria.
        </small>
      </label>
    </section>
  );
}

export default CapaArtigo;
