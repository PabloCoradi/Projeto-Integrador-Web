import { img } from '../assets';
import BotaoVidro from './BotaoVidro';
import './CtaFaq.css';

/** Faixa "Ficou com alguma dúvida?". fundo: 'cinza' | 'escuro' | 'ciano' */
export default function CtaFaq({ fundo = 'cinza' }) {
  const linha = fundo === 'escuro' ? img.linhaCtaEscura : img.linhaCtaClara;
  return (
    <section className={`cta-faq cta-faq--${fundo}`} aria-label="Perguntas frequentes">
      <div className="cta-faq__conteudo container">
        <p className="cta-faq__texto">Ficou com alguma dúvida?</p>
        <span className="cta-faq__linha" aria-hidden="true">
          <img src={linha} alt="" width="187" height="6" />
        </span>
        <BotaoVidro to="/perguntas-frequentes">Sua resposta pode estar aqui</BotaoVidro>
      </div>
    </section>
  );
}
