import './Hero.css';

/**
 * Hero das páginas.
 * altura: altura no frame de 1440px do Figma. Acima de 1440px o hero cresce
 * junto com o resto do layout (unidade --u do global.css).
 * imagem: { src, classe?, estilo? } — classe/estilo reproduzem o recorte do Figma.
 */
export default function Hero({ titulo, imagem, sobreposicao, altura = 476, classe = '', children }) {
  return (
    <section
      className={`hero ${classe}`}
      style={{ '--altura': `calc(${altura} * var(--u))` }}
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
