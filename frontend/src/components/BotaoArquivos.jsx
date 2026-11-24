/**
 * Botão "Arquivos"/"Documentos" das listagens, com a quantidade anexada.
 * Fica destacado quando há arquivos e apagado quando não há nenhum.
 */
function BotaoArquivos({ rotulo, quantidade = 0, onClick }) {
  const temArquivos = quantidade > 0;
  const descricao = temArquivos
    ? `${rotulo}: ${quantidade} ${quantidade === 1 ? "anexado" : "anexados"}`
    : `${rotulo}: nenhum anexado`;

  return (
    <button
      type="button"
      className={`file-count ${temArquivos ? "file-count--has" : ""}`}
      onClick={onClick}
      aria-label={descricao}
      title={descricao}
    >
      <svg
        className="file-count__icon"
        viewBox="0 0 24 24"
        width="13"
        height="13"
        aria-hidden="true"
      >
        <path
          d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {rotulo}
      <span className="file-count__badge">{quantidade}</span>
    </button>
  );
}

export default BotaoArquivos;
