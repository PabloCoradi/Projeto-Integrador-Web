import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");

    if (!email.trim() || !senha) {
      setErro(
        "Informe o e-mail e a senha."
      );

      return;
    }

    try {
      setEntrando(true);

      await login(
        email.trim(),
        senha
      );

      navigate("/");
    } catch (error) {
      setErro(
        error.message ||
        "Não foi possível realizar o login."
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Sistema de Advocacia</h1>

        <p>
          Acesse sua conta
        </p>

        {erro && (
          <div className="error-message">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="primary-button login-button"
            disabled={entrando}
          >
            {entrando
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;