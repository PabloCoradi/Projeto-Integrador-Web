import metricClients from "../../assets/panel/metric-clients.svg";
import metricCases from "../../assets/panel/metric-cases.svg";
import metricArticles from "../../assets/panel/articles-active.svg";
import infoIcon from "../../assets/panel/info.svg";

const indicadores = [
  {
    nome: "Clientes",
    valor: 0,
    nota: "Cadastros ativos",
    icone: metricClients,
  },
  {
    nome: "Casos",
    valor: 0,
    nota: "Casos ativos",
    icone: metricCases,
  },
  {
    nome: "Artigos",
    valor: 0,
    nota: "Artigos cadastrados",
    icone: metricArticles,
  },
];

function Dashboard() {
  return (
    <div className="page page--dashboard">
      <header className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral e indicadores do escritório</p>
        </div>
      </header>

      <section className="welcome-banner">
        <span
          className="welcome-banner__accent"
          aria-hidden="true"
        />

        <span
          className="welcome-banner__orb welcome-banner__orb--one"
          aria-hidden="true"
        />

        <span
          className="welcome-banner__orb welcome-banner__orb--two"
          aria-hidden="true"
        />

        <div className="welcome-banner__content">
          <span>BEM-VINDO AO PAINEL</span>

          <h2>Tudo organizado em um só lugar.</h2>

          <p>
            Acesse clientes, casos e artigos pela navegação lateral.
          </p>
        </div>
      </section>

      <section
        className="metrics-section"
        aria-labelledby="indicadores-titulo"
      >
        <span className="eyebrow">INDICADORES</span>

        <h2 id="indicadores-titulo">
          Valores atuais do sistema
        </h2>

        <div className="metrics-grid">
          {indicadores.map((indicador) => (
            <article
              className="metric-card"
              key={indicador.nome}
            >
              <div className="metric-card__label">
                <span>
                  <img
                    src={indicador.icone}
                    alt=""
                    width="24"
                    height="24"
                  />
                </span>

                <strong>{indicador.nome}</strong>
              </div>

              <p className="metric-card__value">
                {indicador.valor}
              </p>

              <p className="metric-card__note">
                {indicador.nota}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="notice-panel">
        <span className="notice-panel__icon">
          <img
            src={infoIcon}
            alt=""
            width="24"
            height="24"
          />
        </span>

        <div>
          <h2>Indicadores em preparação</h2>

          <p>
            Os números do Dashboard ainda são estáticos.
            A exibição de dados reais será integrada futuramente.
          </p>
        </div>
      </section>

      <p className="stage-footer">
        PROPOSTA VISUAL • ETAPA 01 / SIDEBAR + DASHBOARD
      </p>
    </div>
  );
}

export default Dashboard;