import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarArtigos } from '../services/artigos';
import { imagemDoCard } from '../data/imagensNoticias';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import TituloSecao from '../components/TituloSecao';
import BotaoVidro from '../components/BotaoVidro';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import { useMobile } from '../components/useMobile';
import './Noticias.css';

const POR_PAGINA = 3;
// No celular a grade tem 2 colunas, então carregamos de 2 em 2 (como no Figma)
const POR_PAGINA_MOBILE = 2;

export default function Noticias() {
  const mobile = useMobile();
  const porPagina = mobile ? POR_PAGINA_MOBILE : POR_PAGINA;

  return (
    <div className="pagina pagina--branca">
      <Cabecalho />

      <main>
        <Hero classe="hero--noticias" titulo="Notícias do mundo jurídico sem você sair de casa" />

        <section className="noticias secao" aria-labelledby="noticias-titulo">
          <div className="container">
            <TituloSecao id="noticias-titulo">Notícias</TituloSecao>
          </div>

          {/* A key recomeça a lista do zero se mudar de desktop para celular (3 ↔ 2 por página) */}
          <ListaNoticias key={porPagina} porPagina={porPagina} />
        </section>

        <Contato tema="escuro" />
      </main>

      <Rodape tema="cinza" />
    </div>
  );
}

/** Cards das notícias publicadas no backend, carregados de página em página ("Ver mais..."). */
function ListaNoticias({ porPagina }) {
  const [artigos, setArtigos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Se o componente sair da tela antes da resposta chegar, ela é ignorada
    let cancelado = false;

    listarArtigos(pagina, porPagina)
      .then((dados) => {
        if (cancelado) return;
        setArtigos((atuais) => (pagina === 1 ? dados.items : [...atuais, ...dados.items]));
        setTotalPaginas(dados.total_paginas);
        setErro('');
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [pagina, porPagina]);

  const verMais = () => {
    setCarregando(true);
    setPagina((p) => p + 1);
  };

  const semNoticias = !carregando && !erro && artigos.length === 0;

  return (
    <>
      {artigos.length > 0 && (
        <ul className="noticias__grade container">
          {artigos.map((artigo, i) => {
            const foto = imagemDoCard(i);
            return (
              <li key={artigo.slug}>
                <Link to={`/noticias/${artigo.slug}`} className="card-noticia">
                  <img className="card-noticia__img" src={foto.src} alt="" style={foto.recorte} />
                  <span className="card-noticia__legenda">
                    <span className="card-noticia__titulo">{artigo.titulo}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Avisos: carregando, erro ou nenhuma notícia publicada */}
      <div className="noticias__aviso container" aria-live="polite">
        {carregando && <p>Carregando notícias…</p>}
        {erro && <p role="alert">{erro}</p>}
        {semNoticias && <p>Nenhuma notícia publicada ainda.</p>}
      </div>

      {/* "Ver mais..." aparece enquanto houver páginas no backend */}
      {!carregando && !erro && pagina < totalPaginas && (
        <BotaoVidro tom="escuro" onClick={verMais}>
          Ver mais...
        </BotaoVidro>
      )}
    </>
  );
}
