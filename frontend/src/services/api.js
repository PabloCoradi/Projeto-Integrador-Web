const API_URL = "http://127.0.0.1:8001";

function extrairMensagemErro(dados) {
  const padrao = "Erro ao realizar a requisição.";

  if (!dados) {
    return padrao;
  }

  if (Array.isArray(dados.detail)) {
    const mensagem = dados.detail
      .map((erro) => String(erro.msg).replace(/^Value error, /, ""))
      .join(" ");

    return mensagem || padrao;
  }

  return dados.detail || padrao;
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
    );
  }

  if (!response.ok) {
    let errorData = null;

    try {
      errorData = await response.json();
    } catch {
      // Falha ao ler JSON de erro
    }

    throw new Error(extrairMensagemErro(errorData));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function apiUpload(endpoint, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("access_token");
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_URL}${endpoint}`);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (evento) => {
      if (onProgress && evento.lengthComputable) {
        onProgress(Math.round((evento.loaded / evento.total) * 100));
      }
    };

    xhr.onload = () => {
      let dados = null;

      try {
        dados = JSON.parse(xhr.responseText);
      } catch {
        // Resposta sem corpo JSON
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(dados);
        return;
      }

      reject(new Error(extrairMensagemErro(dados)));
    };

    xhr.onerror = () => {
      reject(new Error("Não foi possível conectar ao servidor."));
    };

    xhr.send(formData);
  });
}