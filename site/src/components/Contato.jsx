import { img } from '../assets';
import { contato, MAPS_URL, WHATSAPP_URL } from '../data/contato';
import TituloSecao from './TituloSecao';
import './Contato.css';

/** tema: 'claro' (sem fundo, texto escuro) | 'escuro' (fundo cinza-escuro) */
export default function Contato({ tema = 'claro' }) {
  const escuro = tema === 'escuro';

  const itens = [
    {
      rotulo: 'Email',
      valor: contato.email,
      href: `mailto:${contato.email}`,
      icone: img.iconeEmail,
    },
    {
      rotulo: 'Whatsapp',
      valor: contato.whatsapp,
      href: WHATSAPP_URL,
      icone: escuro ? img.iconeWhatsappClaro : img.iconeWhatsappEscuro,
    },
    {
      rotulo: 'Instagram',
      valor: contato.instagram,
      href: contato.instagramUrl,
      icone: escuro ? img.iconeInstagramClaro : img.iconeInstagramEscuro,
    },
    {
      rotulo: 'Endereço',
      valor: contato.endereco,
      href: MAPS_URL,
      icone: img.iconeEndereco,
    },
  ];

  return (
    <section id="contato" className={`contato contato--${tema}`} aria-labelledby="contato-titulo">
      <div className="contato__conteudo container">
        <div className="contato__coluna">
          <TituloSecao tom={escuro ? 'claro' : 'escuro'} id="contato-titulo">
            Onde nos
            <br />
            encontrar?
          </TituloSecao>

          <ul className="contato__lista">
            {itens.map((item) => (
              <li key={item.rotulo}>
                <a
                  className="contato__item"
                  href={item.href}
                  target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noreferrer"
                >
                  <img
                    className="contato__icone"
                    src={item.icone}
                    alt=""
                    width="32.832"
                    height="32.832"
                  />
                  <span className="contato__texto">
                    <strong>{item.rotulo}</strong>
                    {Array.isArray(item.valor) ? (
                      <span>
                        {item.valor[0]}
                        <br />
                        {item.valor[1]}
                      </span>
                    ) : (
                      <span>{item.valor}</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <a
          className="contato__mapa"
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir o endereço do escritório no Google Maps"
        >
          <img src={img.mapa} alt="" width="666.66" height="438.965" />
        </a>
      </div>
    </section>
  );
}
