import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './CarrosselAreas.css';

/**
 * Carrossel "360" das áreas de atuação (Início). Os cards correm sozinhos para a esquerda
 * numa faixa "360": no centro eles ficam retos e, perto das bordas, a faixa
 * fica mais alta e os cards desfocam, como no protótipo do Figma.
 * Para ao passar o mouse e dá para arrastar. No celular é o mesmo carrossel
 * pela metade, com o recorte "areas-360_mobile" do Figma (ver o CSS).
 */
const cards = [
  ['Direito', 'Tributário'],
  ['Direito', 'Empresarial'],
  ['Família e', 'Sucessões'],
  ['Direito Médico', 'e Preventivo'],
  ['Adequação', 'LGPD'],
  ['Holding'],
];

// Duas voltas de cards para a faixa nunca ficar vazia nas pontas
const VOLTAS = 2;
const VELOCIDADE = 120; // px por segundo (em 1440px): um card a cada 2,4s, como no protótipo do Figma
const CURVA = 0.2; // quanto a faixa cresce nas pontas
const ARRASTO_MINIMO = 5;

export default function CarrosselAreas() {
  const faixa = useRef(null);
  const itens = useRef([]);

  useEffect(() => {
    const el = faixa.current;
    if (!el) return undefined;

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let deslocamento = 0;
    let pausado = false;
    let arrasto = null;
    let anterior = performance.now();
    let quadro;

    // Leva o card (retângulo) para um trapézio com os 4 cantos dados (homografia)
    const trapezio = (w, h, x0, y0, x1, y1, x2, y2, x3, y3) => {
      const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
      const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
      const det = dx1 * dy2 - dx2 * dy1;
      const g = (dx3 * dy2 - dx2 * dy3) / det;
      const k = (dx1 * dy3 - dx3 * dy1) / det;
      const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3;
      const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
      return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
    };

    const desenhar = () => {
      const largura = el.clientWidth;
      const centroY = el.clientHeight / 2;
      const cartao = itens.current[0]?.offsetWidth || 274;
      const altura = itens.current[0]?.offsetHeight || 305;
      const passo = cartao * (288 / 274); // card + 14px de espaço, como no Figma
      const total = passo * cards.length * VOLTAS;
      const metade = largura / 2;
      // Efeito "360" do Figma: os cards andam em linha reta, mas a faixa é mais
      // alta nas pontas (+20% na borda da tela), como uma tela curva vista de dentro
      const alturaEm = (x) => altura * (1 + CURVA * (x / metade) ** 2);

      itens.current.forEach((item, i) => {
        if (!item) return;
        // Centro do card em relação ao centro da faixa, dando a volta
        let x = (i * passo - deslocamento) % total;
        if (x < -total / 2) x += total;
        if (x > total / 2) x -= total;

        const esq = x - cartao / 2;
        const dir = x + cartao / 2;
        const he = alturaEm(esq) / 2;
        const hd = alturaEm(dir) / 2;
        const xe = metade + esq;
        const xd = metade + dir;
        item.style.transform = trapezio(
          cartao, altura,
          xe, centroY - he, xd, centroY - hd, xd, centroY + hd, xe, centroY + he
        );

        // Nas pontas o card desfoca de leve, como no Figma
        const t = Math.abs(x) / Math.max(metade, 1);
        const desfoque = Math.max(0, t - 0.5) * 3.5 * (cartao / 274);
        item.style.filter = desfoque > 0.15 ? `blur(${desfoque.toFixed(2)}px)` : 'none';
        item.style.visibility = Math.abs(x) - cartao / 2 > metade + 10 ? 'hidden' : 'visible';
      });
    };

    const rodar = (agora) => {
      const dt = Math.min(agora - anterior, 100) / 1000;
      anterior = agora;
      if (!pausado && !arrasto && !reduzido) {
        const escala = (itens.current[0]?.offsetWidth || 274) / 274;
        deslocamento += VELOCIDADE * escala * dt;
      }
      desenhar();
      quadro = requestAnimationFrame(rodar);
    };
    quadro = requestAnimationFrame(rodar);

    const entrar = () => { pausado = true; };
    const sair = () => { pausado = false; };
    const apertar = (e) => {
      arrasto = { x: e.clientX, inicio: deslocamento, moveu: false };
    };
    const mover = (e) => {
      if (!arrasto) return;
      const dx = e.clientX - arrasto.x;
      if (Math.abs(dx) > ARRASTO_MINIMO && !arrasto.moveu) {
        arrasto.moveu = true;
        el.setPointerCapture?.(e.pointerId);
        el.classList.add('carrossel-areas--arrastando');
      }
      if (arrasto.moveu) deslocamento = arrasto.inicio - dx;
    };
    const soltar = (e) => {
      if (!arrasto) return;
      const { moveu } = arrasto;
      arrasto = null;
      el.classList.remove('carrossel-areas--arrastando');
      el.releasePointerCapture?.(e.pointerId);
      // Depois de arrastar, o clique não deve abrir a página
      if (moveu) {
        const bloquear = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
        el.addEventListener('click', bloquear, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', bloquear, { capture: true }), 0);
      }
    };

    el.addEventListener('pointerenter', entrar);
    el.addEventListener('pointerleave', sair);
    el.addEventListener('focusin', entrar);
    el.addEventListener('focusout', sair);
    el.addEventListener('pointerdown', apertar);
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);

    return () => {
      cancelAnimationFrame(quadro);
      el.removeEventListener('pointerenter', entrar);
      el.removeEventListener('pointerleave', sair);
      el.removeEventListener('focusin', entrar);
      el.removeEventListener('focusout', sair);
      el.removeEventListener('pointerdown', apertar);
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', soltar);
      el.removeEventListener('pointercancel', soltar);
    };
  }, []);

  const lista = Array.from({ length: VOLTAS }, () => cards).flat();

  return (
    <div className="carrossel-areas" ref={faixa}>
      <ul className="carrossel-areas__palco">
        {lista.map((linhas, i) => {
          const copia = i >= cards.length;
          return (
            <li
              key={i}
              className="carrossel-areas__item"
              ref={(n) => { itens.current[i] = n; }}
              aria-hidden={copia || undefined}
            >
              <Link
                to="/areas-de-atuacao"
                className="carrossel-areas__card"
                tabIndex={copia ? -1 : undefined}
                draggable="false"
              >
                {linhas.map((l, j) => (
                  <span key={j}>{l}</span>
                ))}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
