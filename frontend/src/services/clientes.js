import { apiRequest, apiUpload } from "./api";

// incluirInativos=true abre também clientes inativos (só para consulta).
export function buscarCliente(clienteId, incluirInativos = false) {
  return apiRequest(`/api/clientes/${clienteId}${incluirInativos ? "?incluir_inativos=true" : ""}`);
}

export function gerarLinkFotoCliente(clienteId) {
  return apiRequest(`/api/clientes/${clienteId}/foto/link`);
}

export function enviarFotoCliente(clienteId, arquivo) {
  const dados = new FormData();
  dados.append("arquivo", arquivo);
  return apiUpload(`/api/clientes/${clienteId}/foto`, dados);
}

export function removerFotoCliente(clienteId) {
  return apiRequest(`/api/clientes/${clienteId}/foto`, { method: "DELETE" });
}
