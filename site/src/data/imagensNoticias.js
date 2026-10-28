import { img } from '../assets';

// Os artigos do backend ainda não têm imagem. Enquanto isso, os cards alternam
// entre as três fotos do Figma (com o mesmo enquadramento de cada card no Figma).
// Quando o backend tiver imagem por artigo, basta usar a dele no lugar desta.
const imagens = [
  {
    src: img.noticiaLaiLgpd,
    recorte: { width: '251.03%', height: '99.95%', left: '-140.25%', top: '0%' },
  },
  {
    src: img.noticiaCodigoCivil,
    recorte: { width: '251.16%', height: '100%', left: '-86.56%', top: '-0.08%' },
  },
  {
    src: img.noticiaCnj,
    recorte: { width: '315.03%', height: '125.43%', left: '-98.69%', top: '-9.91%' },
  },
];

export const imagemDoCard = (indice) => imagens[indice % imagens.length];
