import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import metricClients from "../../assets/panel/metric-clients.svg";
import metricCases from "../../assets/panel/metric-cases.svg";
import metricArticles from "../../assets/panel/articles-active.svg";
import infoIcon from "../../assets/panel/info.svg";

import { useAuth } from "../../contexts/AuthContext";
import {
  buscarResumoDashboard,
  formatarQuando,
  plural,
  saudacao,
} from "../../services/dashboard";

import "./Dashboard.css";

const ROTULO_ATIVIDADE = {
  cliente: "Cliente",
  documento: "Documento",
  caso: "Caso",
  arquivo: "Arquivo",
  artigo: "Artigo",
};

const ROTA_ATIVIDADE = {
  cliente: "/clientes",
  documento: "/clientes",
  caso: "/casos",
  arquivo: "/casos",
  artigo: "/artigos",
};

function montarIndicadores(resumo) {
  const dias = resumo.periodo_dias;
  const indicadores = [];

  if (resumo.clientes) {
    indicadores.push({
      nome: "Clientes",
      valor: resumo.clientes.ativos,
      nota: `${resumo.clientes.novos_no_periodo} novos nos últimos ${dias} dias`,
      icone: metricClients,
      rota: "/clientes",
    });
  }

  if (resumo.casos) {
    indicadores.push({
      nome: "Casos",
      valor: resumo.casos.ativos,
      nota: `${resumo.casos.novos_no_periodo} novos nos últimos ${dias} dias`,
      icone: metricCases,
      rota: "/casos",
    });
  }

  if (resumo.clientes || resumo.casos) {
    const documentos = resumo.clientes?.documentos ?? 0;
    const arquivos = resumo.casos?.arquivos ?? 0;

    indicadores.push({
      nome: "Documentos",
      valor: documentos + arquivos,
      nota:
        resumo.clientes && resumo.casos
          ? `${documentos} de clientes · ${arquivos} de casos`
          : "Arquivos guardados no sistema",
      icone: infoIcon,
      rota: resumo.casos ? "/casos" : "/clientes",
    });
  }

  if (resumo.artigos) {
    indicadores.push({
      nome: "Artigos no site",
      valor: resumo.artigos.publicados,
      nota: plural(resumo.artigos.rascunhos, "rascunho", "rascunhos"),
      icone: metricArticles,
      rota: "/artigos",
    });
  }

  return indicadores;
}

function montarPendencias(resumo, podeEditar) {
  const pendencias = [];

  if (resumo.clientes?.sem_casos_ativos > 0) {
    const total = resumo.clientes.sem_casos_ativos;

    pendencias.push({
      texto: `${plural(total, "cliente", "clientes")} sem nenhum caso em andamento`,
      dica: "Abra um caso ou revise se o cadastro ainda é necessário.",
      rota: "/clientes",
    });
  }

  if (resumo.artigos?.rascunhos > 0 && podeEditar("artigos")) {
    const total = resumo.artigos.rascunhos;

    pendencias.push({
      texto: `${plural(total, "artigo", "artigos")} em rascunho`,
      dica: "Revise e publique para que apareçam no site.",
      rota: "/artigos",
    });
  }

  return pendencias;
}

function CartaoIndicador({ indicador }) {
  return (
    <Link className="metric-card metric-card--link" to={indicador.rota}>
      <div className="metric-card__label">
        <span>
          <img src={indicador.icone} alt="" width="24" height="24" />
        </span>
        <strong>{indicador.nome}</strong>
      </div>

      <p className="metric-card__value">{indicador.valor}</p>
      <p className="metric-card__note">{indicador.nota}</p>
    </Link>
  );
}

function CasosPorArea({ casos }) {
  const maior = Math.max(1, ...casos.por_tipo.map((item) => item.total));

  return (
    <section className="content-card dashboard-panel" aria-labelledby="areas-titulo">
      <span className="eyebrow">CASOS EM ANDAMENTO</span>
      <h2 id="areas-titulo">Por tipo de atendimento</h2>

      {casos.por_tipo.length === 0 ? (
        <p className="dashboard-panel__empty">
          Nenhum caso em andamento ainda.
        </p>
      ) : (
        <ul className="area-bars">
          {casos.por_tipo.map((item) => (
            <li key={item.tipo}>
              <div className="area-bars__label">
                <span>{item.tipo}</span>
                <strong>{item.total}</strong>
              </div>
              <div className="area-bars__track" aria-hidden="true">
                <span style={{ width: `${(item.total / maior) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AtividadeRecente({ atividades }) {
  return (
    <section className="content-card dashboard-panel" aria-labelledby="atividade-titulo">
      <span className="eyebrow">ÚLTIMAS MOVIMENTAÇÕES</span>
      <h2 id="atividade-titulo">Atividade recente</h2>

      {atividades.length === 0 ? (
        <p className="dashboard-panel__empty">
          Assim que algo for cadastrado, aparece aqui.
        </p>
      ) : (
        <ul className="activity-list">
          {atividades.map((atividade, indice) => (
            <li key={`${atividade.tipo}-${atividade.data}-${indice}`}>
              <Link to={ROTA_ATIVIDADE[atividade.tipo]} className="activity-list__item">
                <span className={`activity-list__tag activity-list__tag--${atividade.tipo}`}>
                  {ROTULO_ATIVIDADE[atividade.tipo]}
                </span>
                <span className="activity-list__text">
                  <strong>{atividade.titulo}</strong>
                  <small>{atividade.descricao}</small>
                </span>
                <time dateTime={atividade.data}>{formatarQuando(atividade.data)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Pendencias({ pendencias }) {
  if (pendencias.length === 0) {
    return (
      <section className="notice-panel">
        <span className="notice-panel__icon">
          <img src={infoIcon} alt="" width="24" height="24" />
        </span>
        <div>
          <h2>Tudo em dia</h2>
          <p>Nenhum ponto de atenção no momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-card dashboard-panel" aria-labelledby="atencao-titulo">
      <span className="eyebrow">PONTOS DE ATENÇÃO</span>
      <h2 id="atencao-titulo">Vale dar uma olhada</h2>

      <ul className="attention-list">
        {pendencias.map((pendencia) => (
          <li key={pendencia.texto}>
            <Link to={pendencia.rota}>
              <strong>{pendencia.texto}</strong>
              <small>{pendencia.dica}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Dashboard() {
  const { usuario, podeEditar } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      setResumo(await buscarResumoDashboard());
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const primeiroNome = usuario?.nome?.trim().split(/\s+/)[0];
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const indicadores = resumo ? montarIndicadores(resumo) : [];
  const pendencias = resumo ? montarPendencias(resumo, podeEditar) : [];

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
          <span>
            {saudacao().toUpperCase()}
            {primeiroNome ? `, ${primeiroNome.toUpperCase()}` : ""}
          </span>
          <h2>Tudo organizado em um só lugar.</h2>
          <p className="dashboard-date">Hoje é {hoje}.</p>
        </div>
      </section>

      {carregando && !resumo && (
        <div className="dashboard-loading" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <p>Carregando indicadores...</p>
        </div>
      )}

      {erro && (
        <div className="alert alert--error dashboard-error" role="alert">
          <span>Não foi possível carregar o Dashboard. {erro}</span>
          <button type="button" className="button button--quiet" onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {resumo && (
        <>
          {indicadores.length > 0 && (
            <section className="metrics-section" aria-labelledby="indicadores-titulo">
              <span className="eyebrow">INDICADORES</span>
              <h2 id="indicadores-titulo">Valores atuais do sistema</h2>

              <div className="metrics-grid metrics-grid--dashboard">
                {indicadores.map((indicador) => (
                  <CartaoIndicador key={indicador.nome} indicador={indicador} />
                ))}
              </div>
            </section>
          )}

          <div className="dashboard-columns">
            {resumo.casos && <CasosPorArea casos={resumo.casos} />}
            <AtividadeRecente atividades={resumo.atividades} />
          </div>

          <Pendencias pendencias={pendencias} />
        </>
      )}
    </div>
  );
}

export default Dashboard;
