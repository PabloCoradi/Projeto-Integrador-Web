import { apiRequest, apiUpload } from "./api";

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
