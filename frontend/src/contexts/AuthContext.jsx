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
    localStorage.removeItem("access_token");
    setUsuario(null);

    try {
      const dados = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });

      if (!dados?.access_token) {
        throw new Error("Não foi possível autenticar.");
      }

      localStorage.setItem("access_token", dados.access_token);

      const usuarioAtual = await apiRequest("/api/auth/me");

      if (!usuarioAtual?.id) {
        throw new Error("Não foi possível validar a sessão.");
      }

      setUsuario(usuarioAtual);
    } catch (error) {
      localStorage.removeItem("access_token");
      setUsuario(null);
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUsuario(null);
  }

  function podeVisualizar(modulo) {
    if (usuario?.is_admin) return true;

    return usuario?.permissoes?.some(
      (p) => p.modulo === modulo &&
        (p.pode_visualizar || p.pode_editar)
    ) || false;
  }

  function podeEditar(modulo) {
    if (usuario?.is_admin) return true;

    return usuario?.permissoes?.some(
      (p) => p.modulo === modulo && p.pode_editar
    ) || false;
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        autenticado: !!usuario,
        login,
        logout,
        podeVisualizar,
        podeEditar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
