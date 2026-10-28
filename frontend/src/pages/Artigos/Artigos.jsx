import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Artigos.css";

import { useAuth } from "../../contexts/AuthContext";
import {
  despublicarArtigo,
  excluirArtigo,
  formatarData,
  listarArtigos,
  publicarArtigo,
} from "../../services/artigos";

const ITENS_POR_PAGINA = 8;

const DADOS_VAZIOS = {
  items: [],
  page: 1,
  por_pagina: ITENS_POR_PAGINA,
  total: 0,
  total_paginas: 0,
};

function Artigos() {
  const navigate = useNavigate();
  const { podeEditar } = useAuth();
  const editavel = podeEditar("artigos");

  // O que está sendo pedido à API. Mudar a consulta (página, filtro, busca ou
  // "versao" para recarregar) dispara uma nova busca.
  const [consulta, setConsulta] = useState({ page: 1, status: "", q: "", versao: 0 });
  const [dados, setDados] = useState(DADOS_VAZIOS);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [acaoId, setAcaoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    listarArtigos({
      page: consulta.page,
      porPagina: ITENS_POR_PAGINA,
      status: consulta.status,
      q: consulta.q,
    })
      .then((resposta) => {
        if (!ativo) return;
        setDados(resposta);
        setErro("");
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
  }, [consulta]);

  function consultar(mudancas) {
    setCarregando(true);
    setConsulta((atual) => ({ ...atual, ...mudancas, versao: atual.versao + 1 }));
  }

  function aplicarBusca(event) {
    event.preventDefault();
    setMensagem("");
    consultar({ page: 1, q: busca.trim() });
  }

  function alterarStatus(event) {
    setMensagem("");
    consultar({ page: 1, status: event.target.value });
  }

  function limparFiltros() {
    setBusca("");
    setMensagem("");
    consultar({ page: 1, status: "", q: "" });
  }

  async function alternarPublicacao(artigo) {
    const publicar = artigo.status !== "publicado";

    try {
      setAcaoId(artigo.id);
      setErro("");
      setMensagem("");

      if (publicar) await publicarArtigo(artigo.id);
      else await despublicarArtigo(artigo.id);

      setMensagem(
        publicar
          ? `“${artigo.titulo}” foi publicado e já aparece no site.`
          : `“${artigo.titulo}” saiu do site e voltou para rascunho.`
      );
      consultar({});
    } catch (error) {
      setErro(error.message);
    } finally {
      setAcaoId(null);
    }
  }

  async function remover(artigo) {
    const confirmou = window.confirm(
      `Excluir o artigo “${artigo.titulo}”? Ele sai do site e das listagens.`
    );

    if (!confirmou) return;

    try {
      setAcaoId(artigo.id);
      setErro("");
      setMensagem("");

      await excluirArtigo(artigo.id);
      setMensagem(`“${artigo.titulo}” foi excluído.`);

      // Se era o último item da página, volta uma página
      const ultimaDaPagina = dados.items.length === 1 && dados.page > 1;
      consultar({ page: ultimaDaPagina ? dados.page - 1 : dados.page });
    } catch (error) {
      setErro(error.message);
    } finally {
      setAcaoId(null);
    }
  }

  const possuiFiltros = Boolean(consulta.q || consulta.status);

  return (
    <div className="artigos">
      <div className="page-header">
        <div>
          <h1>Artigos</h1>
          <p>Notícias e artigos exibidos na página de Notícias do site.</p>
        </div>

        {editavel && (
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/artigos/novo")}
          >
            Novo artigo
          </button>
        )}
      </div>

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

      <div className="content-card">
        <form className="artigos-filtros" onSubmit={aplicarBusca}>
          <label className="artigos-campo artigos-campo--busca">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Título, resumo ou conteúdo"
            />
          </label>

          <label className="artigos-campo">
            <span>Status</span>
            <select value={consulta.status} onChange={alterarStatus}>
              <option value="">Todos</option>
              <option value="publicado">Publicados</option>
              <option value="rascunho">Rascunhos</option>
            </select>
          </label>

          <button className="primary-button" type="submit">
            Buscar
          </button>

          {possuiFiltros && (
            <button className="secondary-button" type="button" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </form>

        <p className="artigos-total" aria-live="polite">
          {dados.total} {dados.total === 1 ? "artigo encontrado" : "artigos encontrados"}
        </p>

        {carregando && dados.items.length === 0 ? (
          <p className="artigos-estado">Carregando artigos…</p>
        ) : dados.items.length === 0 ? (
          <p className="artigos-estado">
            {possuiFiltros
              ? "Nenhum artigo encontrado com esses filtros."
              : "Nenhum artigo cadastrado ainda."}
          </p>
        ) : (
          <div className="artigos-tabela">
            <table aria-busy={carregando}>
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Status</th>
                  <th>Publicação</th>
                  <th>Atualização</th>
                  {editavel && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {dados.items.map((artigo) => {
                  const ocupado = acaoId === artigo.id;

                  return (
                    <tr key={artigo.id}>
                      <td>
                        <strong className="artigos-titulo">{artigo.titulo}</strong>
                        <span className="artigos-slug">/noticias/{artigo.slug}</span>
                      </td>
                      <td>
                        <span className={`artigos-status artigos-status--${artigo.status}`}>
                          {artigo.status === "publicado" ? "Publicado" : "Rascunho"}
                        </span>
                      </td>
                      <td>{formatarData(artigo.publicado_em)}</td>
                      <td>{formatarData(artigo.atualizado_em)}</td>
                      {editavel && (
                        <td>
                          <div className="artigos-acoes">
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() => navigate(`/artigos/${artigo.id}/editar`)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() => alternarPublicacao(artigo)}
                            >
                              {artigo.status === "publicado" ? "Despublicar" : "Publicar"}
                            </button>
                            <button
                              type="button"
                              className="artigos-excluir"
                              disabled={ocupado}
                              onClick={() => remover(artigo)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {dados.total_paginas > 1 && (
          <nav className="artigos-paginacao" aria-label="Paginação dos artigos">
            <button
              type="button"
              className="secondary-button"
              disabled={carregando || dados.page <= 1}
              onClick={() => consultar({ page: dados.page - 1 })}
            >
              Anterior
            </button>
            <span>
              Página {dados.page} de {dados.total_paginas}
            </span>
            <button
              type="button"
              className="secondary-button"
              disabled={carregando || dados.page >= dados.total_paginas}
              onClick={() => consultar({ page: dados.page + 1 })}
            >
              Próxima
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default Artigos;
