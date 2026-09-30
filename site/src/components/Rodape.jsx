import { NavLink, Link } from 'react-router-dom';
import { img } from '../assets';
import { paginas } from '../data/contato';
import { rolarParaContato } from './rolarParaContato';
import './Rodape.css';

const itens = [
  ...paginas,
  { rotulo: 'Contato', contato: true },
  { rotulo: 'Perguntas frequentes', para: '/perguntas-frequentes' },
];

/** tema: 'ciano' | 'cinza' | 'claro' */
export default function Rodape({ tema = 'ciano' }) {
  const logo = tema === 'claro' ? img.logoRodapeEscuro : img.logoRodapeClaro;

  return (
    <footer className={`rodape rodape--${tema}`}>
      <div className="rodape__conteudo container">
        <Link to="/" aria-label="Giongo & Raguzzoni — início">
          <img className="rodape__logo" src={logo} alt="" width="209.3" height="58.5" />
        </Link>

        <nav className="rodape__mapa" aria-label="Mapa do site">
          <p className="rodape__titulo">Mapa do site</p>
          <ul className="rodape__lista">
            {itens.map((item) => (
              <li key={item.rotulo}>
                {item.contato ? (
                  <button type="button" onClick={rolarParaContato}>
                    {item.rotulo}
                  </button>
                ) : (
                  <NavLink to={item.para} end>
                    {item.rotulo}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
