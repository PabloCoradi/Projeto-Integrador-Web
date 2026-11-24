import { apiRequest } from "./api";

/**
 * Resumo do Dashboard. Os blocos `clientes`, `casos` e `artigos` vêm como
 * null quando o usuário não tem permissão para ver aquele módulo.
 */
export function buscarResumoDashboard() {
  return apiRequest("/api/dashboard/");
}

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

const relativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** "2026-11-23T14:00:00" (UTC, sem fuso) → "há 2 horas", "ontem", "12 de nov." */
export function formatarQuando(valor, agora = new Date()) {
  if (!valor) return "";

  const possuiFuso = /Z$|[+-]\d{2}:?\d{2}$/.test(valor);
  const data = new Date(possuiFuso ? valor : `${valor}Z`);

  if (Number.isNaN(data.getTime())) return "";

  const diferenca = agora.getTime() - data.getTime();

  if (diferenca < MINUTO) return "agora mesmo";
  if (diferenca < HORA) {
    return relativo.format(-Math.floor(diferenca / MINUTO), "minute");
  }
  if (diferenca < DIA) {
    return relativo.format(-Math.floor(diferenca / HORA), "hour");
  }
  if (diferenca < 7 * DIA) {
    return relativo.format(-Math.floor(diferenca / DIA), "day");
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(data);
}

/** Saudação conforme o horário do computador de quem está usando. */
export function saudacao(agora = new Date()) {
  const hora = agora.getHours();

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}
