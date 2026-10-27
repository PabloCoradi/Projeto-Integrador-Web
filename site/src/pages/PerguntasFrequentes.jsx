import { useLayoutEffect, useRef, useState } from 'react';
import { img } from '../assets';
import { categoriasFaq } from '../data/faq';
import Cabecalho from '../components/Cabecalho';
import TituloSecao from '../components/TituloSecao';
import Seletor from '../components/Seletor';
import Sanfona from '../components/Sanfona';
import Contato from '../components/Contato';
import Rodape from '../components/Rodape';
import './PerguntasFrequentes.css';

export default function PerguntasFrequentes() {
  const [categoria, setCategoria] = useState(categoriasFaq[0].id);
  const indice = categoriasFaq.findIndex((c) => c.id === categoria);

  // Os três painéis ficam lado a lado e deslizam na troca de assunto, como no
  // protótipo do Figma. A janela acompanha a altura do painel visível (inclusive
  // quando uma resposta abre ou fecha).
  const paineis = useRef([]);
  const [altura, setAltura] = useState(null);

  useLayoutEffect(() => {
    const painel = paineis.current[indice];
    if (!painel) return undefined;
    const medir = () => setAltura(painel.offsetHeight);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(painel);
    return () => obs.disconnect();
  }, [indice]);

  return (
    <div className="pagina pagina--branca">
      <Cabecalho fundo={{ altura: 166, imagem: img.cabecalhoFaq }} />

      <main>
        <section className="faq" aria-labelledby="faq-titulo">
          <div className="container">
            <TituloSecao tom="claro" id="faq-titulo" nivel={1}>
              Perguntas frequentes
            </TituloSecao>
          </div>

          <div className="faq__corpo">
            <Seletor
              tema="faq"
              rotulo="Escolha o assunto"
              idPainel="painel-faq"
              opcoes={categoriasFaq.map(({ id, rotulo }) => ({ id, rotulo }))}
              ativo={categoria}
              aoMudar={setCategoria}
            />

            <div
              className="faq__janela"
              id="painel-faq"
              role="tabpanel"
              aria-labelledby={`aba-${categoria}`}
              style={altura ? { height: `calc(${altura}px + 2 * var(--folga))` } : undefined}
            >
              <div className="faq__trilho" style={{ '--i': indice }}>
                {categoriasFaq.map((c, i) => (
                  <div className="faq__vaga" key={c.id}>
                    <div
                      className="faq__painel vidro"
                      aria-hidden={i !== indice || undefined}
                      ref={(el) => {
                        paineis.current[i] = el;
                        if (el) el.inert = i !== indice;
                      }}
                    >
                      {c.perguntas.map((p) => (
                        <Sanfona key={p.pergunta} titulo={p.pergunta} variante="larga">
                          {p.resposta}
                        </Sanfona>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Contato tema="claro" />
      </main>

      <Rodape tema="cinza" />
    </div>
  );
}
