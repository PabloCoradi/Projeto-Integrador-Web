import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { img } from '../assets';
import { paginas } from '../data/contato';
import { rolarParaContato } from './rolarParaContato';
import './Cabecalho.css';

/**
 * Cabeçalho sobreposto ao hero.
 * fundo: { altura, imagem? } — sem imagem usa o degradê escuro do Figma.
 * No celular (Site Mobile do Figma) a navegação vira um menu hambúrguer.
 * No desktop a barra acompanha a rolagem e leva junto o degradê escuro do topo,
 * igual ao do início da página. Nas páginas com faixa de imagem no topo
 * (Quem somos, FAQ), a imagem fica no lugar e o degradê escuro aparece ao rolar.
 */
export default function Cabecalho({ fundo = { altura: 239 }, degradeInicio = false }) {
  const [rolado, setRolado] = useState(false);
  const { pathname } = useLocation();
  const areaMenu = useRef(null);
  const idMenu = useId();

  // O menu guarda em qual página foi aberto: ao trocar de página ele fecha
  // sozinho, sem precisar de efeito. Também fecha ao clicar fora ou com Esc.
  const [menuAbertoEm, setMenuAbertoEm] = useState(null);
  const menuAberto = menuAbertoEm === pathname;
  const setMenuAberto = (abrir) => setMenuAbertoEm(abrir ? pathname : null);

  // Saiu do topo? (nas páginas com faixa de imagem, mostra o degradê escuro atrás da barra)
  useEffect(() => {
    const atualizar = () => setRolado(window.scrollY > 8);
    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
    return () => window.removeEventListener('scroll', atualizar);
  }, []);

  useEffect(() => {
    if (!menuAberto) return undefined;
    const clicarFora = (e) => {
      if (!areaMenu.current?.contains(e.target)) setMenuAbertoEm(null);
    };
    const teclar = (e) => {
      if (e.key === 'Escape') setMenuAbertoEm(null);
    };
    document.addEventListener('pointerdown', clicarFora);
    document.addEventListener('keydown', teclar);
    return () => {
      document.removeEventListener('pointerdown', clicarFora);
      document.removeEventListener('keydown', teclar);
    };
  }, [menuAberto]);

  const classeSombra = [
    'cabecalho__sombra',
    fundo.imagem ? 'cabecalho__sombra--imagem' : '',
    degradeInicio ? 'cabecalho__sombra--inicio' : '',
  ].join(' ');

  const sombra = (
    <div className={classeSombra} style={{ height: `calc(${fundo.altura} * var(--u))` }} aria-hidden="true">
      {fundo.imagem && <img src={fundo.imagem} alt="" />}
    </div>
  );

  const itens = (classe, aoEscolher) => (
    <>
      {paginas.map((p) => (
        <NavLink
          key={p.para}
          to={p.para}
          end
          className={classe}
          data-texto={p.rotulo}
          onClick={aoEscolher}
        >
          {p.rotulo}
        </NavLink>
      ))}
      <button
        type="button"
        className={classe}
        data-texto="Contato"
        onClick={() => {
          aoEscolher?.();
          rolarParaContato();
        }}
      >
        Contato
      </button>
    </>
  );

  return (
    <header className="cabecalho">
      {/* Faixa de imagem (Quem somos, FAQ): fica no topo da página e sobe com ela */}
      {fundo.imagem && sombra}

      <div className={`cabecalho__fixo${rolado ? ' cabecalho__fixo--rolado' : ''}`}>
        {/* O degradê escuro do topo vai junto com a barra o tempo todo (desktop) */}
        {fundo.imagem ? (
          <div
            className="cabecalho__sombra cabecalho__sombra--rolagem"
            style={{ height: 'calc(239 * var(--u))' }}
            aria-hidden="true"
          />
        ) : (
          sombra
        )}

        <div className="cabecalho__barra container">
          <Link to="/" className="cabecalho__logo" aria-label="Giongo & Raguzzoni — início">
            <img src={img.logoCabecalho} alt="" width="177" height="49.47" />
          </Link>

          <nav className="cabecalho__nav vidro" aria-label="Principal">
            {itens('cabecalho__item')}
          </nav>

          <div className="cabecalho__mobile" ref={areaMenu}>
            <button
              type="button"
              className="cabecalho__hamburguer vidro"
              aria-expanded={menuAberto}
              aria-controls={idMenu}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuAberto(!menuAberto)}
            >
              <svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true">
                {menuAberto ? (
                  <path d="M3.5 0.75 14.5 11.25M14.5 0.75 3.5 11.25" />
                ) : (
                  <path d="M0.75 0.75h16.5M0.75 6h16.5M0.75 11.25h16.5" />
                )}
              </svg>
            </button>

            {menuAberto && (
              <nav id={idMenu} className="cabecalho__menu vidro" aria-label="Principal">
                {itens('cabecalho__menu-item', () => setMenuAberto(false))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
