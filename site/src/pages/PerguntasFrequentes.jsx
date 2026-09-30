import { useState } from 'react';
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
  const atual = categoriasFaq.find((c) => c.id === categoria);

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
              className="faq__painel vidro container"
              id="painel-faq"
              role="tabpanel"
              aria-labelledby={`aba-${categoria}`}
            >
              {atual.perguntas.map((p) => (
                <Sanfona key={`${categoria}-${p.pergunta}`} titulo={p.pergunta} variante="larga">
                  {p.resposta}
                </Sanfona>
              ))}
            </div>
          </div>
        </section>

        <Contato tema="claro" />
      </main>

      <Rodape tema="cinza" />
    </div>
  );
}
