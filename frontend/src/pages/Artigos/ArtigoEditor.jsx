import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./Artigos.css";

import {
  atualizarArtigo,
  consultarArtigo,
  criarArtigo,
  despublicarArtigo,
  dividirParagrafos,
  publicarArtigo,
} from "../../services/artigos";

const CAMPOS_VAZIOS = {
  titulo: "",
  resumo: "",
  conteudo: "",
};

// O que vai para a API: campos vazios viram null (o artigo continua rascunho)
function dadosEditoriais(campos) {
  return {
    titulo: campos.titulo.trim(),
    resumo: campos.resumo.trim() || null,
    conteudo: campos.conteudo.trim() || null,
  };
}

function camposDoArtigo(artigo) {
  return {
    titulo: artigo.titulo,
    resumo: artigo.resumo || "",
    conteudo: artigo.conteudo || "",
  };
}

function ArtigoEditor() {
  const { artigoId } = useParams();
  const navigate = useNavigate();
  const novo = !artigoId;

  const [artigo, setArtigo] = useState(null);
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [salvo, setSalvo] = useState(CAMPOS_VAZIOS);
  const [carregando, setCarregando] = useState(!novo);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  // No celular, mostra um painel por vez
  const [painel, setPainel] = useState("editor");

  const alterado = useMemo(
    () => JSON.stringify(campos) !== JSON.stringify(salvo),
    [campos, salvo]
  );

  // Abre um artigo existente
  useEffect(() => {
    if (novo) return undefined;

    let ativo = true;

    consultarArtigo(artigoId)
      .then((resposta) => {
        if (!ativo) return;
        setArtigo(resposta);
        setCampos(camposDoArtigo(resposta));
        setSalvo(camposDoArtigo(resposta));
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [artigoId, novo]);

  // Avisa antes de fechar ou recarregar a aba com alterações não salvas
  useEffect(() => {
    function protegerSaida(event) {
      if (!alterado) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", protegerSaida);
    return () => window.removeEventListener("beforeunload", protegerSaida);
  }, [alterado]);

  function alterarCampo(event) {
    const { name, value } = event.target;
    setCampos((atuais) => ({ ...atuais, [name]: value }));
    setMensagem("");
    setErro("");
  }

  function validar() {
    const titulo = campos.titulo.trim();

    if (titulo.length < 2) {
      throw new Error("Informe um título com pelo menos 2 caracteres.");
    }

    if (titulo.length > 250) {
      throw new Error("O título deve ter no máximo 250 caracteres.");
    }
  }

  async function salvar({ silencioso = false } = {}) {
    validar();

    const dados = dadosEditoriais(campos);
    const resposta = novo
      ? await criarArtigo(dados)
      : await atualizarArtigo(artigo.id, dados);

    setArtigo(resposta);
    setCampos(camposDoArtigo(resposta));
    setSalvo(camposDoArtigo(resposta));
    if (!silencioso) setMensagem("Rascunho salvo.");

    // Artigo novo passa a ter endereço próprio de edição
    if (novo) {
      navigate(`/artigos/${resposta.id}/editar`, { replace: true });
    }

    return resposta;
  }

  async function executar(acao) {
    try {
      setProcessando(true);
      setErro("");
      setMensagem("");

      if (acao === "salvar") {
        await salvar();
        return;
      }

      if (acao === "publicar") {
        const artigoSalvo = alterado || novo ? await salvar({ silencioso: true }) : artigo;
        const publicado = await publicarArtigo(artigoSalvo.id);
        setArtigo(publicado);
        setMensagem("Artigo publicado. Ele já aparece na página de Notícias do site.");
        return;
      }

      const despublicado = await despublicarArtigo(artigo.id);
      setArtigo(despublicado);
      setMensagem("Artigo retirado do site. Ele continua salvo como rascunho.");
    } catch (error) {
      setErro(error.message);
    } finally {
      setProcessando(false);
    }
  }

  function voltar() {
    if (alterado && !window.confirm("Descartar as alterações não salvas?")) return;
    navigate("/artigos");
  }

  if (carregando) {
    return <p className="artigos-estado">Carregando artigo…</p>;
  }

  if (!novo && !artigo) {
    return (
      <div className="content-card artigos-falha" role="alert">
        <strong>Não foi possível abrir este artigo.</strong>
        <p>{erro}</p>
        <button type="button" className="secondary-button" onClick={() => navigate("/artigos")}>
          Voltar para os artigos
        </button>
      </div>
    );
  }

  const publicado = artigo?.status === "publicado";
  const paragrafos = dividirParagrafos(campos.conteudo);

  return (
    <div className="artigo-editor">
      <div className="page-header artigo-editor__topo">
        <div>
          <button type="button" className="artigo-editor__voltar" onClick={voltar}>
            ← Artigos
          </button>
          <h1>
            {novo ? "Novo artigo" : "Editar artigo"}{" "}
            <span className={`artigos-status artigos-status--${artigo?.status || "rascunho"}`}>
              {publicado ? "Publicado" : "Rascunho"}
            </span>
          </h1>
        </div>

        <div className="artigo-editor__comandos">
          {publicado && (
            <button
              type="button"
              className="secondary-button"
              disabled={processando}
              onClick={() => executar("despublicar")}
            >
              Despublicar
            </button>
          )}
          <button
            type="button"
            className="secondary-button"
            disabled={processando || (!alterado && !novo)}
            onClick={() => executar("salvar")}
          >
            {processando ? "Salvando…" : "Salvar rascunho"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={processando}
            onClick={() => executar("publicar")}
          >
            {publicado ? "Salvar e atualizar no site" : "Publicar"}
          </button>
        </div>
      </div>

      <div className="artigo-editor__avisos" aria-live="polite">
        {erro && (
          <div className="error-message" role="alert">
            {erro}
          </div>
        )}
        {mensagem && (
          <div className="artigos-sucesso" role="status">
            {mensagem}
          </div>
        )}
        {!erro && !mensagem && alterado && (
          <p className="artigo-editor__pendente">Há alterações ainda não salvas.</p>
        )}
      </div>

      <div className="artigo-editor__abas" role="tablist" aria-label="Painel visível">
        <button
          type="button"
          role="tab"
          aria-selected={painel === "editor"}
          className={painel === "editor" ? "ativa" : ""}
          onClick={() => setPainel("editor")}
        >
          Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={painel === "previa"}
          className={painel === "previa" ? "ativa" : ""}
          onClick={() => setPainel("previa")}
        >
          Pré-visualização
        </button>
      </div>

      <div className="artigo-editor__area">
        <form
          className={`content-card artigo-editor__form ${painel === "editor" ? "visivel" : ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            executar("salvar");
          }}
        >
          <label className="artigos-campo">
            <span>Título</span>
            <input
              name="titulo"
              value={campos.titulo}
              onChange={alterarCampo}
              maxLength={250}
              placeholder="Título claro e objetivo"
              required
              autoFocus={novo}
            />
            <small>{campos.titulo.length}/250</small>
          </label>

          <label className="artigos-campo">
            <span>Resumo</span>
            <textarea
              name="resumo"
              value={campos.resumo}
              onChange={alterarCampo}
              rows={4}
              placeholder="Em poucas linhas, do que trata o artigo"
            />
            <small>
              Obrigatório para publicar. É a descrição curta do artigo (o site, hoje, mostra só
              título, data e conteúdo).
            </small>
          </label>

          <label className="artigos-campo artigo-editor__conteudo">
            <span>Conteúdo</span>
            <textarea
              name="conteudo"
              value={campos.conteudo}
              onChange={alterarCampo}
              placeholder={"Primeiro parágrafo…\n\nSegundo parágrafo…"}
              spellCheck="true"
            />
            <small>
              Obrigatório para publicar. Deixe uma linha em branco entre os parágrafos.
            </small>
          </label>
        </form>

        <aside
          className={`content-card artigo-editor__previa ${painel === "previa" ? "visivel" : ""}`}
          aria-label="Pré-visualização"
        >
          <span className="artigo-editor__previa-rotulo">Como vai aparecer no site</span>
          <article>
            <h2>{campos.titulo.trim() || "Título do artigo"}</h2>
            {paragrafos.length > 0 ? (
              paragrafos.map((paragrafo, indice) => <p key={indice}>{paragrafo}</p>)
            ) : (
              <p className="artigo-editor__vazio">
                O texto aparece aqui enquanto você escreve.
              </p>
            )}
          </article>
        </aside>
      </div>
    </div>
  );
}

export default ArtigoEditor;
