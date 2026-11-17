export function EtiquetaTag({ tag }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        background: "#e5e7eb",
        color: "#1f2937",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {tag}
    </span>
  );
}

// Campo de texto livre com sugestões; vazio = tag padrão OUTROS no backend
export function CampoTag({ id, value, onChange, sugestoes, disabled, placeholder }) {
  const idLista = `${id}-sugestoes`;

  return (
    <div className="form-group" style={{ flex: "1 1 240px", margin: 0 }}>
      <label htmlFor={id}>Tag</label>
      <input
        id={id}
        type="text"
        list={idLista}
        value={value}
        maxLength={50}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <datalist id={idLista}>
        {sugestoes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

export function FiltroTag({ id, tags, value, onChange }) {
  if (tags.length < 2) return null;

  return (
    <div className="form-group" style={{ maxWidth: 320, marginBottom: 16 }}>
      <label htmlFor={id}>Filtrar por tag</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas</option>
        {tags.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
