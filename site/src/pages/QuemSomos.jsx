import { useState } from 'react';
import { img } from '../assets';
import { advogadas } from '../data/advogadas';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import TituloSecao from '../components/TituloSecao';
import Seletor from '../components/Seletor';
import { inerte } from '../components/inerte';
import CtaFaq from '../components/CtaFaq';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import './QuemSomos.css';

const Destaque = ({ children }) => <strong className="destaque">{children}</strong>;

export default function QuemSomos() {
  const [ativa, setAtiva] = useState('patricia');

  return (
    <div className="pagina">
      <Cabecalho fundo={{ altura: 207, imagem: img.cabecalhoQuemSomos }} />

      <main>
        <Hero
          classe="hero--quem"
          imagem={{
            src: img.heroQuemSomos,
            classe: 'hero__img--quem',
          }}
          titulo="Conheça quem trabalha para defender seus direitos"
        />

        <section className="sobre secao" aria-labelledby="sobre-titulo">
          <div className="container">
            <TituloSecao tom="claro" id="sobre-titulo">
              A Giongo &amp; Raguzzoni
            </TituloSecao>
          </div>
          <div className="container">
            <p className="sobre__texto">
              Há mais de <Destaque>30 anos</Destaque>, a Giongo &amp; Raguzzoni atua ao lado de empresas,
              oferecendo <Destaque>soluções jurídicas com estratégia</Destaque>, proximidade e visão de
              longo prazo. Com uma <Destaque>atuação multidisciplinar</Destaque> e atendimento
              transparente, acompanha cada cliente de forma personalizada, buscando os{' '}
              <Destaque>caminhos mais seguros e eficientes</Destaque> para proteger seus interesses.
            </p>
          </div>
        </section>

        <section className="equipe secao" aria-labelledby="equipe-titulo">
          <div className="container">
            <TituloSecao id="equipe-titulo">Quem faz acontecer</TituloSecao>
          </div>

          <div className="equipe__carrossel">
            <div
              className={`equipe__palco equipe__palco--${ativa}`}
              id="painel-advogadas"
              role="tabpanel"
              aria-labelledby={`aba-${ativa}`}
            >
              <div className="equipe__foto" aria-hidden="true">
                <img src={img.advogadasCarrossel} alt="" />
              </div>
              {advogadas.map((a) => (
                <article
                  key={a.id}
                  className={`advogada advogada--${a.id} vidro vidro--claro`}
                  ref={inerte(a.id === ativa)}
                  aria-hidden={a.id !== ativa}
                >
                  <div className="advogada__cabecalho">
                    <h3 className="advogada__nome">{a.nome}</h3>
                    <img
                      className="advogada__linha"
                      src={img.linhaTituloCard}
                      alt=""
                      width="83"
                      height="6"
                    />
                  </div>
                  <div className="advogada__bio">
                    {a.paragrafos.map((p) => (
                      <p key={p.slice(0, 20)}>{p}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <Seletor
              tema="quem"
              rotulo="Escolha a advogada"
              idPainel="painel-advogadas"
              opcoes={advogadas.map((a) => ({ id: a.id, rotulo: a.nome }))}
              ativo={ativa}
              aoMudar={setAtiva}
            />
          </div>
        </section>

        <CtaFaq fundo="ciano" />
        <Contato tema="escuro" />
      </main>

      <Rodape tema="claro" />
    </div>
  );
}
