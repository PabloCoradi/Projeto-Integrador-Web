import { API_URL, apiRequest, apiUpload } from "./api";

// Deve ser igual ao TAMANHO_MAXIMO_MB do backend (imagem_artigo_service.py)
export const LIMITE_IMAGEM_MB = 10;
export const TIPOS_IMAGEM = "image/jpeg,image/png,image/webp";

/** A API devolve caminhos relativos (/api/public/...); aqui viram endereço completo. */
export function urlDaImagem(caminho) {
  if (!caminho) return "";
  if (/^https?:\/\//.test(caminho)) return caminho;

  return `${API_URL.replace(/\/+$/, "")}${caminho}`;
}

export function listarImagensPadrao() {
  return apiRequest("/api/public/imagens-artigos/padrao");
}

export function listarImagensEnviadas() {
  return apiRequest("/api/imagens-artigos");
}

export function enviarImagem(arquivo, onProgress) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  return apiUpload("/api/imagens-artigos", formData, onProgress);
}

export function removerImagem(imagemId) {
  return apiRequest(`/api/imagens-artigos/${imagemId}`, { method: "DELETE" });
}
