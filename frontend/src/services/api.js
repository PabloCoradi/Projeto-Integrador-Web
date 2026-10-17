
const API_URL = "http://127.0.0.1:8000";

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
    let errorMessage = "Erro ao realizar a requisição.";

    try {
      const errorData = await response.json();

      if (response.status >= 500) {
  errorMessage =
    "O servidor apresentou um erro. Tente novamente mais tarde.";
} else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((erro) => erro.msg || "Dados inválidos.")
          .join(" ");
      } else if (response.status >= 500) {
        errorMessage =
          "O servidor apresentou um erro. Tente novamente mais tarde.";
      }
    } catch {
      if (response.status >= 500) {
        errorMessage =
          "O servidor apresentou um erro. Tente novamente mais tarde.";
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
