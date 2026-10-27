
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

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
    <div className="login-page">
      <div className="login-card">
        <h1>Redefinir senha</h1>

        <p>Informe seu e-mail e escolha uma nova senha.</p>

        {erro && (
          <div className="error-message">{erro}</div>
        )}

        {sucesso && (
          <div className="success-message">{sucesso}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Confirme a nova senha"
            />
          </div>

          <button
            type="submit"
            className="primary-button login-button"
            disabled={salvando}
          >
            {salvando ? "Alterando..." : "Alterar senha"}
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
    </div>
  );
}

export default RedefinirSenha;
