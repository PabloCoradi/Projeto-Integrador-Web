import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { buscarArtigo, dividirParagrafos, formatarData } from '../services/artigos';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import './Noticias.css';
import './Noticia.css';

export default function Noticia() {
  const { slug } = useParams();
  // Guarda de qual slug é a resposta: enquanto ela não for do slug atual, está carregando
  const [resposta, setResposta] = useState({ slug: null, artigo: null, erro: '' });

  useEffect(() => {
    let cancelado = false;

    buscarArtigo(slug)
      .then((artigo) => {
        if (!cancelado) setResposta({ slug, artigo, erro: '' });
      })
      .catch((e) => {
        if (!cancelado) setResposta({ slug, artigo: null, erro: e.message });
      });

    return () => {
      cancelado = true;
    };
  }, [slug]);

  const carregando = resposta.slug !== slug;
  const { artigo, erro } = resposta;

  // Artigo inexistente ou despublicado (404 da API): volta para a lista
  if (!carregando && !erro && !artigo) return <Navigate to="/noticias" replace />;

  let titulo = 'Carregando notícia…';
  if (erro) titulo = 'Notícia indisponível';
  else if (artigo) titulo = artigo.titulo;

  return (
    <div className="pagina pagina--branca">
      <Cabecalho />

      <main>
        <Hero classe="hero--noticias hero--noticia" titulo={titulo}>
          {artigo && (
            <p className="hero__data">
              Publicado em{' '}
              <time dateTime={artigo.publicado_em}>{formatarData(artigo.publicado_em)}</time>
            </p>
          )}
        </Hero>

        <article className="noticia" aria-busy={carregando}>
          <div className="noticia__texto container">
            {artigo && dividirParagrafos(artigo.conteudo).map((p, i) => <p key={i}>{p}</p>)}

            {erro && (
              <p role="alert">
                {erro} <Link to="/noticias">Voltar para as notícias</Link>
              </p>
            )}
          </div>
        </article>

        <Contato tema="escuro" />
      </main>

      <Rodape tema="cinza" />
    </div>
  );
}
