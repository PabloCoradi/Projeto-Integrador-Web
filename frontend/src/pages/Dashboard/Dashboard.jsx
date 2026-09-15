function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <p>
        Bem-vindo ao Sistema de Advocacia.
      </p>

      <div className="cards">
        <div className="card">
          <span className="card-title">Clientes</span>
          <strong>0</strong>
        </div>

        <div className="card">
          <span className="card-title">Casos</span>
          <strong>0</strong>
        </div>

        <div className="card">
          <span className="card-title">Compromissos</span>
          <strong>0</strong>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;