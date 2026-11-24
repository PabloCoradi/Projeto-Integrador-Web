import { useEffect, useState } from "react";

import metricClients from "../../assets/panel/metric-clients.svg";
import metricCases from "../../assets/panel/metric-cases.svg";
import metricArticles from "../../assets/panel/articles-active.svg";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../services/api";
import { listarArtigos } from "../../services/artigos";
import { listarCasos } from "../../services/casos";

const indicadoresConfig = [
  { chave: "clientes", nome: "Clientes", icone: metricClients },
  { chave: "casos", nome: "Casos", icone: metricCases },
  { chave: "artigos", nome: "Artigos publicados", icone: metricArticles },
];
const chavesIndicadores = indicadoresConfig.map(({ chave }) => chave);

const numeroFormatado = new Intl.NumberFormat("pt-BR");

function Dashboard() {
  const { usuario } = useAuth();
  const isAdmin = Boolean(usuario?.is_admin);
  const permissoes = usuario?.permissoes || [];
  const podeVer = (modulo) => isAdmin || permissoes.some(
    (permissao) => permissao.modulo === modulo &&
      (permissao.pode_visualizar || permissao.pode_editar)
  );
  const podeVerClientes = podeVer("clientes");
  const podeVerCasos = podeVer("casos");
  const podeVerArtigos = podeVer("artigos");
  const permissoesIndicadores = {
    clientes: podeVerClientes,
    casos: podeVerCasos,
    artigos: podeVerArtigos,
  };
  const [indicadores, setIndicadores] = useState(() => ({
    clientes: { carregando: true, valor: null, erro: false },
    casos: { carregando: true, valor: null, erro: false },
    artigos: { carregando: true, valor: null, erro: false },
  }));

  useEffect(() => {
    let ativo = true;
    const permissoesConsultas = [
      podeVerClientes,
      podeVerCasos,
      podeVerArtigos,
    ];
    const consultas = [
      podeVerClientes
        ? apiRequest("/api/clientes/").then((dados) => dados.length)
        : Promise.resolve(null),
      podeVerCasos
        ? listarCasos().then((dados) => dados.length)
        : Promise.resolve(null),
      podeVerArtigos
        ? listarArtigos({ page: 1, porPagina: 1, status: "publicado" })
            .then((dados) => dados.total)
        : Promise.resolve(null),
    ];

    Promise.allSettled(consultas).then((resultados) => {
      if (!ativo) return;

      setIndicadores(Object.fromEntries(chavesIndicadores.map((chave, indice) => {
        if (!permissoesConsultas[indice]) {
          return [chave, { carregando: false, valor: null, erro: false }];
        }

        const resultado = resultados[indice];
        return [chave, resultado.status === "fulfilled"
          ? { carregando: false, valor: resultado.value, erro: false }
          : { carregando: false, valor: null, erro: true }];
      })));
    });

    return () => {
      ativo = false;
    };
  }, [podeVerClientes, podeVerCasos, podeVerArtigos]);

  return (
    <div className="page page--dashboard">
      <header className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral e indicadores do escritório</p>
        </div>
      </header>

      <section className="welcome-banner">
        <span className="welcome-banner__accent" aria-hidden="true" />
        <span className="welcome-banner__orb welcome-banner__orb--one" aria-hidden="true" />
        <span className="welcome-banner__orb welcome-banner__orb--two" aria-hidden="true" />

        <div className="welcome-banner__content">
          <span>Bem-vindo ao painel</span>
          <h2>Tudo organizado em um só lugar.</h2>
          <p>Acesse clientes, casos e artigos pela navegação lateral.</p>
        </div>
      </section>

      <section className="metrics-section" aria-labelledby="indicadores-titulo">
        <h2 id="indicadores-titulo">Indicadores do escritório</h2>

        <div className="metrics-grid">
          {indicadoresConfig.map((indicador) => {
            const estado = indicadores[indicador.chave];
            const semPermissao = !permissoesIndicadores[indicador.chave];
            const nota = semPermissao
              ? "Sem permissão para visualizar"
              : estado.carregando
                ? "Carregando dados…"
                : estado.erro
                  ? "Não foi possível carregar"
                  : indicador.chave === "artigos"
                    ? "Publicações no site"
                    : "Total cadastrado";

            return (
              <article className="metric-card" key={indicador.chave}>
                <div className="metric-card__label">
                  <span>
                    <img src={indicador.icone} alt="" width="24" height="24" />
                  </span>
                  <strong>{indicador.nome}</strong>
                </div>

                <p className="metric-card__value" aria-live="polite">
                  {semPermissao || estado.carregando || estado.erro
                    ? "—"
                    : numeroFormatado.format(estado.valor)}
                </p>
                <p className="metric-card__note">{nota}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
