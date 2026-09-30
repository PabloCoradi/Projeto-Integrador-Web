// Torna um bloco não focável/não clicável quando está escondido.
// Usa a propriedade DOM `inert`, que funciona igual no React 18 e no 19.
export const inerte = (visivel) => (el) => {
  if (el) el.inert = !visivel;
};
