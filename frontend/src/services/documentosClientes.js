import { apiRequest, apiUpload } from "./api";

// Sugestões exibidas no campo de tag (o usuário pode digitar outra)
export const TAGS_PADRAO = [
  "CNH",
  "IDENTIDADE",
  "CPF",
  "COMPROVANTE DE RESIDÊNCIA",
  "CERTIDÃO DE NASCIMENTO",
  "CERTIDÃO DE CASAMENTO",
  "CARTEIRA DE TRABALHO",
  "PROCURAÇÃO",
  "OUTROS",
];

export function listarDocumentos(clienteId, tag) {
  const query = tag ? `?tag=${encodeURIComponent(tag)}` : "";

  return apiRequest(`/api/clientes/${clienteId}/documentos/${query}`);
}

export function listarTagsUsadas() {
  return apiRequest("/api/clientes/documentos/tags");
}

export function enviarDocumento(clienteId, arquivo, tag, onProgress) {
  const formData = new FormData();

  formData.append("arquivo", arquivo);
  formData.append("tag", tag);

  return apiUpload(
    `/api/clientes/${clienteId}/documentos/`,
    formData,
    onProgress
  );
}

export function gerarLinkDocumento(clienteId, documentoId, inline = false) {
  return apiRequest(
    `/api/clientes/${clienteId}/documentos/${documentoId}/link?inline=${inline}`
  );
}

export function alterarTagDocumento(clienteId, documentoId, tag) {
  return apiRequest(`/api/clientes/${clienteId}/documentos/${documentoId}`, {
    method: "PATCH",
    body: JSON.stringify({ tag }),
  });
}

export function inativarDocumento(clienteId, documentoId) {
  return apiRequest(`/api/clientes/${clienteId}/documentos/${documentoId}`, {
    method: "DELETE",
  });
}

// Documentos do cliente vistos a partir de um caso
export function listarDocumentosDoCaso(casoId) {
  return apiRequest(`/api/casos/${casoId}/documentos-cliente/`);
}

export function gerarLinkDocumentoDoCaso(casoId, documentoId, inline = false) {
  return apiRequest(
    `/api/casos/${casoId}/documentos-cliente/${documentoId}/link?inline=${inline}`
  );
}
