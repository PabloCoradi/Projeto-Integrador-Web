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

  const [consulta, setConsulta] = useState({
    page: 1,
    status: "",
    q: "",
    versao: 0,
  });

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
        if (ativo) {
          setErro(error.message);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [consulta]);

  function consultar(mudancas) {
    setCarregando(true);

    setConsulta((atual) => ({
      ...atual,
      ...mudancas,
      versao: atual.versao + 1,
    }));
  }

  function aplicarBusca(event) {
    event.preventDefault();

    setMensagem("");

    consultar({
      page: 1,
      q: busca.trim(),
    });
  }

  function alterarStatus(event) {
    setMensagem("");

    consultar({
      page: 1,
      status: event.target.value,
    });
  }

  function limparFiltros() {
    setBusca("");
    setMensagem("");

    consultar({
      page: 1,
      status: "",
      q: "",
    });
  }

  async function alternarPublicacao(artigo) {
    if (!editavel) return;

    const publicar = artigo.status !== "publicado";

    try {
      setAcaoId(artigo.id);
      setErro("");
      setMensagem("");

      if (publicar) {
        await publicarArtigo(artigo.id);
      } else {
        await despublicarArtigo(artigo.id);
      }

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
    if (!editavel) return;

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

      const ultimaDaPagina =
        dados.items.length === 1 && dados.page > 1;

      consultar({
        page: ultimaDaPagina
          ? dados.page - 1
          : dados.page,
      });
    } catch (error) {
      setErro(error.message);
    } finally {
      setAcaoId(null);
    }
  }

  const possuiFiltros = Boolean(
    consulta.q || consulta.status
  );

  const inicio = dados.total
    ? (dados.page - 1) * ITENS_POR_PAGINA + 1
    : 0;

  const fim = Math.min(
    dados.page * ITENS_POR_PAGINA,
    dados.total
  );

  return (
    <div className="page page--articles">
      <header className="page-heading page-heading--action">
        <div>
          <h1>Artigos</h1>

          <p>
            Gerencie os conteúdos editoriais publicados
            no site institucional.
          </p>
        </div>

        {editavel && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => navigate("/artigos/novo")}
          >
            + Novo artigo
          </button>
        )}
      </header>

      {erro && (
        <div className="alert alert--error" role="alert">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="artigos-sucesso" role="status">
          {mensagem}
        </div>
      )}

      <section className="surface data-panel articles-library">
        <div className="section-heading">
          <h2>Biblioteca de artigos</h2>

          <p>
            Consulte artigos, rascunhos e publicações
            do escritório.
          </p>
        </div>

        <form
          className="filters-row article-filters"
          onSubmit={aplicarBusca}
        >
          <div className="form-field filters-row__search">
            <label htmlFor="artigo-busca">
              Buscar
            </label>

            <input
              id="artigo-busca"
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Pesquise por título, resumo ou conteúdo..."
            />
          </div>

          <div className="form-field">
            <label htmlFor="artigo-status">
              Status
            </label>

            <select
              id="artigo-status"
              value={consulta.status}
              onChange={alterarStatus}
            >
              <option value="">
                Todos
              </option>

              <option value="rascunho">
                Rascunhos
              </option>

              <option value="publicado">
                Publicados
              </option>
            </select>
          </div>

          <div className="filters-row__actions">
            <button
              className="button button--primary"
              type="submit"
            >
              Buscar
            </button>

            {possuiFiltros && (
              <button
                className="button button--quiet"
                type="button"
                onClick={limparFiltros}
              >
                Limpar
              </button>
            )}
          </div>

          <small>
            A busca é aplicada ao clicar em Buscar.
            O filtro de status é atualizado ao selecionar uma opção.
          </small>
        </form>

        <p className="results-summary" aria-live="polite">
          {dados.total}{" "}
          {dados.total === 1
            ? "artigo encontrado"
            : "artigos encontrados"}
        </p>

        {carregando && dados.items.length === 0 ? (
          <div className="empty-state">
            Carregando artigos...
          </div>
        ) : dados.items.length === 0 ? (
          <div className="empty-state">
            {possuiFiltros
              ? "Nenhum artigo encontrado com esses filtros."
              : "Nenhum artigo cadastrado ainda."}
          </div>
        ) : (
          <div className="table-scroll artigos-tabela">
            <table
              className="data-table articles-table"
              aria-busy={carregando}
            >
              <thead>
                <tr>
                  <th>Conteúdo</th>
                  <th>Status</th>
                  <th>Publicado em</th>
                  <th>Atualizado em</th>

                  {editavel && (
                    <th>Ações</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {dados.items.map((artigo) => {
                  const ocupado = acaoId === artigo.id;

                  return (
                    <tr key={artigo.id}>
                      <td>
                        <strong>
                          {artigo.titulo}
                        </strong>

                        <small>
                          /noticias/{artigo.slug}
                        </small>
                      </td>

                      <td>
                        <span
                          className={
                            `article-status article-status--${artigo.status}`
                          }
                        >
                          {artigo.status === "publicado"
                            ? "Publicado"
                            : "Rascunho"}
                        </span>
                      </td>

                      <td>
                        {formatarData(artigo.publicado_em)}
                      </td>

                      <td>
                        {formatarData(artigo.atualizado_em)}
                      </td>

                      {editavel && (
                        <td>
                          <span className="table-actions">
                            <button
                              type="button"
                              className="text-action"
                              disabled={ocupado}
                              onClick={() =>
                                navigate(
                                  `/artigos/${artigo.id}/editar`
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="text-action"
                              disabled={ocupado}
                              onClick={() =>
                                alternarPublicacao(artigo)
                              }
                            >
                              {artigo.status === "publicado"
                                ? "Despublicar"
                                : "Publicar"}
                            </button>

                            <button
                              type="button"
                              className="text-action text-action--danger"
                              disabled={ocupado}
                              onClick={() =>
                                remover(artigo)
                              }
                            >
                              Excluir
                            </button>
                          </span>
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
          <nav
            className="pagination"
            aria-label="Paginação dos artigos"
          >
            <span>
              Exibindo {inicio}–{fim} de {dados.total} artigos
            </span>

            <div>
              <button
                type="button"
                className="button button--quiet"
                disabled={
                  carregando || dados.page <= 1
                }
                onClick={() =>
                  consultar({
                    page: dados.page - 1,
                  })
                }
              >
                Anterior
              </button>

              <span>
                Página {dados.page} de {dados.total_paginas}
              </span>

              <button
                type="button"
                className="button button--quiet"
                disabled={
                  carregando ||
                  dados.page >= dados.total_paginas
                }
                onClick={() =>
                  consultar({
                    page: dados.page + 1,
                  })
                }
              >
                Próxima
              </button>
            </div>
          </nav>
        )}
      </section>

      <p className="stage-footer">
        ETAPA 05 / ARTIGOS • LISTAGEM E PUBLICAÇÃO
      </p>
    </div>
  );
}

export default Artigos;