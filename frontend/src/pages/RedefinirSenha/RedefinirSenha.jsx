
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import logo from "../../assets/login/logo-giongo-raguzzoni.svg";

function RedefinirSenha() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!email.trim() || !novaSenha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSalvando(true);

      await apiRequest("/api/auth/redefinir-senha", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          nova_senha: novaSenha,
          confirmar_senha: confirmarSenha,
        }),
      });

      setSucesso("Senha alterada com sucesso!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setErro(error.message || "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="login-page login-page--reset">
      <div className="login-card login-card--reset">
        <img className="login-card__logo" src={logo} alt="Giongo & Raguzzoni" width="209" height="59" />
        <h1>Redefinir senha</h1>

        <p>Informe seu e-mail e escolha uma nova senha.</p>

        {erro && (
          <div className="error-message" role="alert">{erro}</div>
        )}

        {sucesso && (
          <div className="success-message" role="status" aria-live="polite">{sucesso}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              name="nova_senha"
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Digite a nova senha"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              name="confirmar_senha"
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Confirme a nova senha"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button login-button"
            disabled={salvando}
          >
            {salvando ? "Alterando…" : "Alterar senha"}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/login")}
        >
          Voltar para o login
        </button>
      </div>
    </main>
  );
}

export default RedefinirSenha;
