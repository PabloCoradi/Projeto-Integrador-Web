import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const dados = await apiRequest("/api/auth/me");

        setUsuario(dados);
      } catch {
        localStorage.removeItem("access_token");
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    }

    verificarSessao();
  }, []);

  async function login(email, senha) {
    const dados = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    localStorage.setItem(
      "access_token",
      dados.access_token
    );

    const usuarioAtual = await apiRequest(
      "/api/auth/me"
    );

    setUsuario(usuarioAtual);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        autenticado: !!usuario,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}