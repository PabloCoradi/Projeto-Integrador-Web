import { apiRequest } from "./api";

// Rotas administrativas de artigos (/api/artigos). Exigem login e permissão
// no módulo "artigos" (administradores têm acesso total).

export function listarArtigos({ page = 1, porPagina = 10, status, q } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    por_pagina: String(porPagina),
  });

  if (status) params.set("status", status);
  if (q) params.set("q", q);

  return apiRequest(`/api/artigos?${params.toString()}`);
}

export function consultarArtigo(id) {
  return apiRequest(`/api/artigos/${id}`);
}

export function criarArtigo(dados) {
  return apiRequest("/api/artigos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarArtigo(id, dados) {
  return apiRequest(`/api/artigos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export function publicarArtigo(id) {
  return apiRequest(`/api/artigos/${id}/publicar`, { method: "POST" });
}

export function despublicarArtigo(id) {
  return apiRequest(`/api/artigos/${id}/despublicar`, { method: "POST" });
}

export function excluirArtigo(id) {
  return apiRequest(`/api/artigos/${id}`, { method: "DELETE" });
}

/** Mesma regra do site: cada linha em branco separa um parágrafo. */
export function dividirParagrafos(conteudo) {
  return (conteudo || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

/** "2026-06-11T12:00:00" (UTC, sem fuso) → "11 de jun. de 2026" */
export function formatarData(valor) {
  if (!valor) return "—";

  const possuiFuso = /Z$|[+-]\d{2}:?\d{2}$/.test(valor);
  const data = new Date(possuiFuso ? valor : `${valor}Z`);

  if (Number.isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(data);
}
