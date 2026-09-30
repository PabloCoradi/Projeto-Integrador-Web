import './Hero.css';

/**
 * Hero das páginas.
 * altura: altura no frame de 1440px do Figma. Acima de 1440px o hero cresce
 * na mesma proporção (até 1,5×), para a foto manter o enquadramento.
 * imagem: { src, classe?, estilo? } — classe/estilo reproduzem o recorte do Figma.
 */
export default function Hero({ titulo, imagem, sobreposicao, altura = 476, classe = '', children }) {
  return (
    <section
      className={`hero ${classe}`}
      style={{ '--altura': `${altura}px`, '--altura-fluida': `${(altura / 14.4).toFixed(3)}vw` }}
    >
      {imagem && (
        <div className="hero__fundo" aria-hidden="true">
          <img src={imagem.src} alt="" className={imagem.classe} style={imagem.estilo} />
          {sobreposicao && <span className="hero__sobreposicao" style={{ background: sobreposicao }} />}
        </div>
      )}
      <div className="hero__conteudo container">
        {titulo && <h1 className="hero__titulo">{titulo}</h1>}
        {children}
      </div>
    </section>
  );
}
