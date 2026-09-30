import { Link } from 'react-router-dom';
import { img } from '../assets';
import Cabecalho from '../components/Cabecalho';
import Hero from '../components/Hero';
import TituloSecao from '../components/TituloSecao';
import BotaoVidro from '../components/BotaoVidro';
import CarrosselDepoimentos from '../components/CarrosselDepoimentos';
import CtaFaq from '../components/CtaFaq';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import './Inicio.css';

const Destaque = ({ children }) => <strong className="destaque">{children}</strong>;

const advogadas = [
  {
    id: 'patricia',
    nome: ['Patrícia', 'Giongo'],
    foto: img.cardPatricia,
    fotoHover: img.cardPatriciaCor,
  },
  {
    id: 'juliana',
    nome: ['Juliana', 'Raguzzoni'],
    foto: img.cardJuliana,
    fotoHover: img.cardJulianaCor,
  },
];

export default function Inicio() {
  return (
    <div className="pagina">
      <Cabecalho fundo={{ altura: 295 }} degradeInicio />

      <main>
        <Hero
          altura={623}
          classe="hero--inicio"
          imagem={{
            src: img.heroInicio,
            classe: 'hero__img--inicio',
          }}
          titulo={
            <>
              Visão completa
              <br />
              para decisões seguras
            </>
          }
        />

        <section className="inicio-areas secao" aria-labelledby="inicio-areas-titulo">
          <div className="container">
            <TituloSecao tom="claro" id="inicio-areas-titulo">
              Áreas de atuação
            </TituloSecao>
          </div>
          <div className="inicio-areas__conteudo">
            <Link to="/areas-de-atuacao" className="inicio-areas__imagem">
              <img
                src={img.areas360}
                alt="Direito Tributário, Direito Empresarial, Família e Sucessões, Direito Médico e Preventivo, Adequação à LGPD e Holding"
                width="1440"
                height="400"
              />
            </Link>
            <BotaoVidro to="/areas-de-atuacao">Saiba mais</BotaoVidro>
          </div>
        </section>

        <section className="inicio-quem secao" aria-labelledby="inicio-quem-titulo">
          <div className="container">
            <TituloSecao id="inicio-quem-titulo">Quem somos</TituloSecao>
          </div>

          <div className="inicio-quem__conteudo container">
            <div className="inicio-quem__texto">
              <p>
                A Giongo &amp; Raguzzoni une <Destaque>experiência, estratégia e proximidade</Destaque>{' '}
                em uma atuação jurídica voltada às reais necessidades de cada cliente.
              </p>
              <p>
                Com <Destaque>mais de 30 anos de trajetória na área empresarial</Destaque>, o escritório
                se consolidou a partir de um atendimento <Destaque>próximo</Destaque>,
                <Destaque> transparente</Destaque> e construído <Destaque>com confiança</Destaque>. Hoje,
                mantém sua base sólida enquanto acompanha as transformações do mercado e das relações, com
                uma comunicação mais clara, atual e acessível.
              </p>
              <p>
                Atuamos de forma <Destaque>estratégica e preventiva</Destaque>, oferecendo acompanhamento
                completo nas{' '}
                <Destaque>
                  áreas empresarial, recuperação judicial e falências, direito médico, família e
                  sucessões, holding e tributário.
                </Destaque>
              </p>
            </div>

            <div className="inicio-quem__fotos">
              {advogadas.map((a) => (
                <Link
                  key={a.id}
                  to="/quem-somos"
                  className={`card-foto card-foto--${a.id}`}
                  aria-label={`Conheça ${a.nome.join(' ')}`}
                >
                  <span className="card-foto__midia" aria-hidden="true">
                    <img
                      className="card-foto__img card-foto__img--padrao"
                      src={a.foto}
                      alt=""
                      width="242"
                      height="300"
                    />
                    <img
                      className="card-foto__img card-foto__img--hover"
                      src={a.fotoHover}
                      alt=""
                    />
                  </span>
                  <span className="card-foto__nome">
                    {a.nome[0]}
                    <br />
                    {a.nome[1]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <BotaoVidro to="/quem-somos" tom="escuro">
            Saiba mais
          </BotaoVidro>
        </section>

        <CarrosselDepoimentos />
        <CtaFaq fundo="cinza" />
        <Contato tema="claro" />
      </main>

      <Rodape tema="ciano" />
    </div>
  );
}
