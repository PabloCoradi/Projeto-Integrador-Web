import { useState } from 'react';
import { img } from '../assets';
import { depoimentos } from '../data/depoimentos';
import TituloSecao from './TituloSecao';
import { inerte } from './inerte';
import './CarrosselDepoimentos.css';

export default function CarrosselDepoimentos() {
  const [indice, setIndice] = useState(0);
  const total = depoimentos.length;
  const ir = (passo) => setIndice((i) => (i + passo + total) % total);

  return (
    <section
      className="depoimentos"
      aria-roledescription="carrossel"
      aria-labelledby="depoimentos-titulo"
    >
      <div className="depoimentos__fundo" aria-hidden="true">
        <img src={img.depoimentosFundo} alt="" />
      </div>

      <div className="depoimentos__titulo container">
        <TituloSecao tom="claro" id="depoimentos-titulo">
          Depoimentos
        </TituloSecao>
      </div>

      <div className="depoimentos__janela" aria-live="polite">
        <ul className="depoimentos__trilho" style={{ '--i': indice }}>
          {depoimentos.map((d, i) => (
            <li
              key={d.autor}
              className="depoimento vidro"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}`}
              ref={inerte(i === indice)}
              aria-hidden={i !== indice}
            >
              <p className="depoimento__titulo">“{d.titulo}”</p>
              <div className="depoimento__corpo">
                <p className="depoimento__texto">{d.texto}</p>
                <p className="depoimento__autor">{d.autor}</p>
              </div>
              <p className="depoimento__area">{d.area}</p>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="depoimentos__seta depoimentos__seta--anterior vidro"
        onClick={() => ir(-1)}
        aria-label="Depoimento anterior"
      >
        <img src={img.setaEsquerda} alt="" width="24" height="48" />
      </button>
      <button
        type="button"
        className="depoimentos__seta depoimentos__seta--proxima vidro"
        onClick={() => ir(1)}
        aria-label="Próximo depoimento"
      >
        <img src={img.setaDireita} alt="" width="24" height="48" />
      </button>
    </section>
  );
}
