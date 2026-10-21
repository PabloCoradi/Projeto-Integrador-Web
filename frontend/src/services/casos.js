import { apiRequest, apiUpload } from "./api";

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

export function listarArquivos(casoId) {
  return apiRequest(`/api/casos/${casoId}/arquivos/`);
}

export function enviarArquivo(casoId, arquivo, onProgress) {
  const formData = new FormData();

  formData.append("arquivo", arquivo);

  return apiUpload(`/api/casos/${casoId}/arquivos/`, formData, onProgress);
}

export function gerarLinkArquivo(casoId, arquivoId, inline = false) {
  return apiRequest(
    `/api/casos/${casoId}/arquivos/${arquivoId}/link?inline=${inline}`
  );
}

export function inativarArquivo(casoId, arquivoId) {
  return apiRequest(`/api/casos/${casoId}/arquivos/${arquivoId}`, {
    method: "DELETE",
  });
}