import { useLayoutEffect, useRef, useState } from 'react';
import './Seletor.css';

/**
 * Seletor em pílula com indicador ciano deslizante ("Slider" / "slider FAQ").
 * tema: 'quem' (inativo em ciano) | 'faq' (inativo em cinza, ativo em negrito)
 */
export default function Seletor({ opcoes, ativo, aoMudar, tema = 'faq', rotulo, idPainel }) {
  const refs = useRef({});
  const [indicador, setIndicador] = useState(null);

  useLayoutEffect(() => {
    const medir = () => {
      const el = refs.current[ativo];
      if (el) setIndicador({ left: el.offsetLeft, width: el.offsetWidth });
    };
    medir();
    const obs = new ResizeObserver(medir);
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [ativo, opcoes]);

  const mover = (direcao) => {
    const i = opcoes.findIndex((o) => o.id === ativo);
    const prox = opcoes[(i + direcao + opcoes.length) % opcoes.length];
    aoMudar(prox.id);
    refs.current[prox.id]?.focus();
  };

  return (
    <div
      className={`seletor seletor--${tema} vidro`}
      role="tablist"
      aria-label={rotulo}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') mover(1);
        if (e.key === 'ArrowLeft') mover(-1);
      }}
    >
      {indicador && (
        <span
          className="seletor__indicador"
          style={{ transform: `translateX(${indicador.left}px)`, width: indicador.width }}
          aria-hidden="true"
        />
      )}
      {opcoes.map((o) => {
        const selecionado = o.id === ativo;
        return (
          <button
            key={o.id}
            ref={(el) => (refs.current[o.id] = el)}
            type="button"
            role="tab"
            id={`aba-${o.id}`}
            aria-selected={selecionado}
            aria-controls={idPainel}
            tabIndex={selecionado ? 0 : -1}
            className={`seletor__opcao ${selecionado ? 'seletor__opcao--ativa' : ''}`}
            data-texto={o.rotulo}
            onClick={() => aoMudar(o.id)}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
