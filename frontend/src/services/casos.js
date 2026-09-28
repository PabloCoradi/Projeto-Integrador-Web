import { apiRequest } from "./api";

export function listarCasos({ clienteId, tipoAtendimento, q } = {}) {
  const params = new URLSearchParams();

  if (clienteId) params.set("cliente_id", clienteId);
  if (tipoAtendimento) params.set("tipo_atendimento", tipoAtendimento);
  if (q) params.set("q", q);

  const query = params.toString();

  return apiRequest(`/api/casos/${query ? `?${query}` : ""}`);
}

export function buscarCaso(id) {
  return apiRequest(`/api/casos/${id}`);
}

export function criarCaso(dados) {
  return apiRequest("/api/casos/", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarCaso(id, dados) {
  return apiRequest(`/api/casos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function inativarCaso(id) {
  return apiRequest(`/api/casos/${id}`, {
    method: "DELETE",
  });
}