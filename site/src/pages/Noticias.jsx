import { useState } from 'react';
import { Link } from 'react-router-dom';
import { noticias } from '../data/noticias';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import TituloSecao from '../components/TituloSecao';
import BotaoVidro from '../components/BotaoVidro';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import { useMobile } from '../components/useMobile';
import './Noticias.css';

const POR_PAGINA = 3;
// No celular a grade tem 2 colunas, então mostramos de 2 em 2 (como no Figma)
const POR_PAGINA_MOBILE = 2;

export default function Noticias() {
  const mobile = useMobile();
  const porPagina = mobile ? POR_PAGINA_MOBILE : POR_PAGINA;
  const [extras, setExtras] = useState(0);
  const visiveis = porPagina + extras;

  return (
    <div className="pagina pagina--branca">
      <Cabecalho />

      <main>
        <Hero classe="hero--noticias" titulo="Notícias do mundo jurídico sem você sair de casa" />

        <section className="noticias secao" aria-labelledby="noticias-titulo">
          <div className="container">
            <TituloSecao id="noticias-titulo">Notícias</TituloSecao>
          </div>

          <ul className="noticias__grade container">
            {noticias.slice(0, visiveis).map((n) => (
              <li key={n.slug}>
                <Link to={`/noticias/${n.slug}`} className="card-noticia">
                  <img className="card-noticia__img" src={n.imagem} alt="" style={n.recorte} />
                  <span className="card-noticia__legenda">
                    <span className="card-noticia__titulo">{n.titulo}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* "Ver mais..." aparece quando houver mais notícias cadastradas */}
          {visiveis < noticias.length && (
            <BotaoVidro tom="escuro" onClick={() => setExtras((v) => v + porPagina)}>
              Ver mais...
            </BotaoVidro>
          )}
        </section>

        <Contato tema="escuro" />
      </main>

      <Rodape tema="cinza" />
    </div>
  );
}
