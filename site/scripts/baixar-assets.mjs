// Baixa as imagens e ícones exportados do Figma para public/assets.
// Rode uma vez com: npm run assets
// Os links do Figma expiram cerca de 7 dias depois de gerados (16/09/2026).

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://www.figma.com/api/mcp/asset';
const P = {
  inicio: 'ae1b3e2d-c6ac-44ad-aff8-ff490fae7aaf',
  areas: 'ec9d647b-bf75-4ca4-9b0c-4d27be1995df',
  quem: '25627be4-5d05-498c-af39-6755c393de29',
  sanfona: '7066c8b7-19bb-42ab-bd10-29aadd3eaca1',
};

// [nome local, grupo, arquivo no Figma]
const ASSETS = [
  ['logo-cabecalho.svg', 'inicio', '78d83.svg'],
  ['logo-rodape-claro.svg', 'inicio', '932fc.svg'],
  ['logo-rodape-escuro.svg', 'quem', '8a83a.svg'],
  ['linha-titulo.svg', 'inicio', 'ec169.svg'],
  ['linha-cta-clara.svg', 'inicio', 'bca9e.svg'],
  ['linha-cta-escura.svg', 'areas', 'e476c.svg'],
  ['icone-email.svg', 'inicio', 'f6465.svg'],
  ['icone-whatsapp-escuro.svg', 'inicio', '1dd15.svg'],
  ['icone-instagram-escuro.svg', 'inicio', '3532c.svg'],
  ['icone-whatsapp-claro.svg', 'quem', '444be.svg'],
  ['icone-instagram-claro.svg', 'quem', '0c426.svg'],
  ['icone-endereco.svg', 'inicio', '279ab.svg'],
  ['icone-whatsapp-flutuante.svg', 'inicio', 'f173b.svg'],
  ['seta-direita.svg', 'inicio', '418ed.svg'],
  ['seta-esquerda.svg', 'inicio', 'a8c67.svg'],
  ['chevron-fechado.svg', 'areas', 'f32b5.svg'],
  ['chevron-aberto.svg', 'sanfona', '6d135.svg'],
  ['mapa.png', 'inicio', 'ba1dd.png'],
  ['hero-inicio.png', 'inicio', '8b94e.png'],
  ['areas-360.png', 'inicio', '013af.png'],
  ['depoimentos-fundo.png', 'inicio', '8977d.png'],
  ['card-patricia.png', 'inicio', '10818.png'],
  ['card-juliana.png', 'inicio', 'a6f26.png'],
  ['hero-areas.png', 'areas', '8298b.png'],
];

const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');
await mkdir(destino, { recursive: true });

let falhas = 0;
for (const [nome, grupo, arquivo] of ASSETS) {
  const url = `${BASE}/${P[grupo]}/${arquivo}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(join(destino, nome), Buffer.from(await res.arrayBuffer()));
    console.log(`✓ ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.error(`✗ ${nome} (${erro.message})`);
  }
}

if (falhas) {
  console.error(
    `\n${falhas} arquivo(s) não baixaram. Se os links expiraram, exporte essas imagens ` +
      'direto do Figma e salve em public/assets com os nomes acima.'
  );
  process.exit(1);
}
console.log(`\nPronto: ${ASSETS.length} arquivos em public/assets`);
