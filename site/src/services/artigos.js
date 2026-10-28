// Conversa com a API pública de artigos do backend (sem login).
// O endereço vem de VITE_API_URL (arquivo .env); sem ele, usa o backend local.
const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

const ERRO_CONEXAO = 'Não foi possível carregar as notícias agora. Tente novamente mais tarde.';

async function pedir(caminho) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error(ERRO_CONEXAO);
  }

  if (resposta.status === 404) return null;
  if (!resposta.ok) throw new Error(ERRO_CONEXAO);
  return resposta.json();
}

/**
 * GET /api/public/artigos?page=&por_pagina=
 * Retorna { items: [{ titulo, slug, resumo, publicado_em }], page, por_pagina, total, total_paginas }
 */
export function listarArtigos(pagina, porPagina) {
  const params = new URLSearchParams({ page: pagina, por_pagina: porPagina });
  return pedir(`/api/public/artigos?${params}`);
}

/**
 * GET /api/public/artigos/{slug}
 * Retorna { titulo, slug, resumo, conteudo, publicado_em } ou null se não existir.
 */
export function buscarArtigo(slug) {
  return pedir(`/api/public/artigos/${encodeURIComponent(slug)}`);
}

/** "2026-06-11T13:00:00" (UTC, sem fuso) → "11 de junho de 2026" */
export function formatarData(iso) {
  if (!iso) return '';
  const temFuso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const data = new Date(temFuso ? iso : `${iso}Z`);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** O backend manda o texto inteiro em `conteudo`: cada linha em branco separa um parágrafo. */
export function dividirParagrafos(conteudo) {
  return (conteudo || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
