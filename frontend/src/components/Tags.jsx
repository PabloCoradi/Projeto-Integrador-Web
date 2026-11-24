export function EtiquetaTag({ tag }) {
  return <span className="file-tag">{tag}</span>;
}

// Campo de texto livre com sugestões; vazio = tag padrão OUTROS no backend
export function CampoTag({ id, value, onChange, sugestoes, disabled, placeholder }) {
  const idLista = `${id}-sugestoes`;

  return (
    <div className="form-group file-tag-field">
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
    <div className="form-group file-tag-filter">
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
