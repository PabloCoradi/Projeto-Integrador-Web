import { useId, useState } from 'react';
import { img } from '../assets';
import { inerte } from './inerte';
import './Sanfona.css';

/**
 * Sanfona do Figma.
 * variante 'meia'  → "Sanfona half" (vidro claro, texto escuro, título do detalhe em ciano)
 * variante 'larga' → "menu sanfona largo" (borda clara, texto claro)
 */
export default function Sanfona({ titulo, subtitulo, children, variante = 'meia' }) {
  const [aberta, setAberta] = useState(false);
  const id = useId();

  const chevron =
    variante === 'meia' && aberta ? img.chevronAberto : img.chevronFechado;

  return (
    <div
      className={`sanfona sanfona--${variante} ${variante === 'meia' ? 'vidro vidro--claro' : ''} ${
        aberta ? 'sanfona--aberta' : ''
      }`}
    >
      <button
        type="button"
        className="sanfona__cabecalho"
        aria-expanded={aberta}
        aria-controls={`${id}-conteudo`}
        onClick={() => setAberta((v) => !v)}
      >
        <span className="sanfona__titulo">{titulo}</span>
        <span className="sanfona__chevron" aria-hidden="true">
          <img src={chevron} alt="" width="8" height="14" />
        </span>
      </button>

      <div
        id={`${id}-conteudo`}
        className="sanfona__painel"
        role="region"
        aria-label={titulo}
        ref={inerte(aberta)}
      >
        <div className="sanfona__interno">
          <div className="sanfona__detalhe">
            {subtitulo && <p className="sanfona__subtitulo">{subtitulo}</p>}
            <div className="sanfona__texto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
