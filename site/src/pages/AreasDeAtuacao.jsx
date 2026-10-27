import { img } from '../assets';
import { areas } from '../data/areas';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import TituloSecao from '../components/TituloSecao';
import Sanfona from '../components/Sanfona';
import CtaFaq from '../components/CtaFaq';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import './AreasDeAtuacao.css';

const colunas = [areas.slice(0, 3), areas.slice(3)];

export default function AreasDeAtuacao() {
  return (
    <div className="pagina">
      <Cabecalho />

      <main>
        <Hero
          classe="hero--areas"
          imagem={{
            src: img.heroAreas,
            classe: 'hero__img--cobrir',
          }}
          sobreposicao="#262b31"
          titulo="Soluções jurídicas para sua jornada"
        />

        <section className="areas secao" aria-labelledby="areas-titulo">
          <div className="container">
            <TituloSecao tom="preto" id="areas-titulo">
              Áreas de atuação
            </TituloSecao>
          </div>

          <div className="areas__grade container">
            {colunas.map((coluna, c) => (
              <div className="areas__coluna" key={c}>
                {coluna.map((area, linha) => (
                  // No celular vira uma lista só, lida linha a linha (esquerda, direita…), como no Figma
                  <div className="areas__item" key={area.nome} style={{ '--ordem': linha * 2 + c }}>
                    <Sanfona titulo={area.nome} subtitulo={area.titulo}>
                      {area.texto}
                    </Sanfona>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <CtaFaq fundo="escuro" />
        <Contato tema="claro" />
      </main>

      <Rodape tema="ciano" />
    </div>
  );
}
