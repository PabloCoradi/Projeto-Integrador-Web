import { img } from '../assets';
import './TituloSecao.css';

/** tom: 'escuro' (texto cinza-escuro) | 'claro' (texto branco-gelo) | 'preto' */
export default function TituloSecao({ children, tom = 'escuro', id, nivel = 2 }) {
  const Tag = nivel === 1 ? 'h1' : 'h2';
  return (
    <div className={`titulo-secao titulo-secao--${tom}`}>
      <span className="titulo-secao__linha" aria-hidden="true">
        <img src={img.linhaTitulo} alt="" width="82.5" height="6" />
      </span>
      <Tag id={id} className="titulo-secao__texto">
        {children}
      </Tag>
    </div>
  );
}
