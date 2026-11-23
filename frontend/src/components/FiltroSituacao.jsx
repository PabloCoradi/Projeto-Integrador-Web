const OPCOES = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "inativos", rotulo: "Inativos" },
];

/** Alterna a listagem entre registros ativos e inativados. */
function FiltroSituacao({ valor, onChange, rotulo }) {
  return (
    <div className="status-toggle" role="group" aria-label={rotulo}>
      {OPCOES.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          className={valor === opcao.valor ? "is-active" : ""}
          aria-pressed={valor === opcao.valor}
          onClick={() => onChange(opcao.valor)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}

export default FiltroSituacao;
