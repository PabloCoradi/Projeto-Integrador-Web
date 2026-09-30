import { Link, NavLink } from 'react-router-dom';
import { img } from '../assets';
import { paginas } from '../data/contato';
import { rolarParaContato } from './rolarParaContato';
import './Cabecalho.css';

/**
 * Cabeçalho sobreposto ao hero.
 * fundo: { altura, imagem? } — sem imagem usa o degradê escuro do Figma.
 */
export default function Cabecalho({ fundo = { altura: 239 }, degradeInicio = false }) {
  const classeSombra = [
    'cabecalho__sombra',
    fundo.imagem ? 'cabecalho__sombra--imagem' : '',
    degradeInicio ? 'cabecalho__sombra--inicio' : '',
  ].join(' ');

  return (
    <header className="cabecalho">
      <div className={classeSombra} style={{ height: fundo.altura }} aria-hidden="true">
        {fundo.imagem && <img src={fundo.imagem} alt="" />}
      </div>

      <div className="cabecalho__barra container">
        <Link to="/" className="cabecalho__logo" aria-label="Giongo & Raguzzoni — início">
          <img src={img.logoCabecalho} alt="" width="177" height="49.47" />
        </Link>

        <nav className="cabecalho__nav vidro" aria-label="Principal">
          {paginas.map((p) => (
            <NavLink
              key={p.para}
              to={p.para}
              end
              className="cabecalho__item"
              data-texto={p.rotulo}
            >
              {p.rotulo}
            </NavLink>
          ))}
          <button
            type="button"
            className="cabecalho__item"
            data-texto="Contato"
            onClick={rolarParaContato}
          >
            Contato
          </button>
        </nav>
      </div>
    </header>
  );
}
