import { Navigate, useParams } from 'react-router-dom';
import { noticias } from '../data/noticias';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import './Noticias.css';
import './Noticia.css';

export default function Noticia() {
  const { slug } = useParams();
  const noticia = noticias.find((n) => n.slug === slug);

  if (!noticia) return <Navigate to="/noticias" replace />;

  return (
    <div className="pagina pagina--branca">
      <Cabecalho />

      <main>
        <Hero classe="hero--noticias hero--noticia" titulo={noticia.titulo}>
          <p className="hero__data">
            Atualizado pela última vez em <time>{noticia.atualizadaEm}</time>
          </p>
        </Hero>

        <article className="noticia">
          <div className="noticia__texto container">
            {noticia.paragrafos.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </article>

        <Contato tema="escuro" />
      </main>

      <Rodape tema="cinza" />
    </div>
  );
}
