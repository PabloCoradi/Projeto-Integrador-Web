import { img } from '../assets';
import { WHATSAPP_URL } from '../data/contato';
import './BotaoWhatsapp.css';

export default function BotaoWhatsapp() {
  return (
    <a
      className="botao-whatsapp"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar pelo WhatsApp"
    >
      <img src={img.iconeWhatsappFlutuante} alt="" width="28.8" height="28.8" />
    </a>
  );
}
