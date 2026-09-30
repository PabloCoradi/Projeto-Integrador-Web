import { Link } from 'react-router-dom';
import './BotaoVidro.css';

/** Botão "CTA" do Figma. tom: 'claro' (texto claro, fundo escuro) | 'escuro' */
export default function BotaoVidro({ to, children, tom = 'claro', ...props }) {
  const classe = `botao-vidro vidro botao-vidro--${tom}`;
  if (to) {
    return (
      <Link to={to} className={classe} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classe} {...props}>
      {children}
    </button>
  );
}
