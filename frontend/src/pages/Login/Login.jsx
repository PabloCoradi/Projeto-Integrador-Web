import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import logo from "../../assets/login/logo-giongo-raguzzoni.svg";
import fotoAdvogadas from "../../assets/login/advogadas-login.webp";

import "./Login.css";


// Ícones usados só no visual da tela
function IconeEmail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
    </svg>
  );
}

function IconeOlho({ riscado }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {riscado && <path d="M4 4l16 16" />}
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}


function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  // Apenas visual: alterna entre mostrar e esconder a senha digitada.
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    try {
      setEntrando(true);
      await login(email.trim(), senha);
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
    <div className="login">
      <svg
        className="login__fundo"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="login-grad-escuro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f3942" />
            <stop offset="55%" stopColor="#232a31" />
            <stop offset="100%" stopColor="#1b2127" />
          </linearGradient>
        </defs>

        <path
          className="login__fundo-escuro"
          fill="url(#login-grad-escuro)"
          d="M930 0 C 1010 260, 1040 520, 1000 1000 L1440 1000 L1440 0 Z"
        />
        <path
          className="login__fundo-faceta"
          d="M1440 380 L1180 1000 L1440 1000 Z"
        />
        <path
          className="login__fundo-linha"
          d="M1100 380 C 1250 210, 1360 80, 1440 -10"
        />
      </svg>

      <div className="login__escritorio" aria-hidden="true" />

      <section className="login__marca" aria-label="Giongo & Raguzzoni">
        <div className="login__marca-texto">
          <img
            className="login__logo-grande"
            src={logo}
            alt="Giongo & Raguzzoni"
          />

          <span className="login__traco" aria-hidden="true" />

          <h1 className="login__titulo">
            Visão completa para decisões seguras
          </h1>

          <p className="login__subtitulo">
            Acesse sua conta para continuar.
          </p>
        </div>

        <div className="login__area-foto">
          <img
            className="login__foto"
            src={fotoAdvogadas}
            alt="Patrícia Giongo e Juliana Raguzzoni"
          />
        </div>

        <svg
          className="login__onda"
          viewBox="0 0 700 330"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="login__onda-escura"
            d="M0 30 C 210 40, 430 170, 620 330 L0 330 Z"
          />
        </svg>

        {/* Linha ciano da onda, desenhada por cima das advogadas */}
        <svg
          className="login__onda login__onda--linha"
          viewBox="0 0 700 330"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="login__onda-linha"
            d="M0 30 C 210 40, 430 170, 620 330"
          />
        </svg>

        <div className="login__lema" aria-hidden="true">
          <span className="login__traco login__traco--pequeno" />
          <span>Pessoas</span>
          <span>Estratégia</span>
          <span>Resultados</span>
        </div>
      </section>

      <main className="login__area-cartao">
        <div className="login__cartao">
          <img
            className="login__logo-cartao"
            src={logo}
            alt="Giongo & Raguzzoni"
          />

          <h2 className="login__titulo-cartao">Acesse sua conta</h2>

          <p className="login__subtitulo-cartao">
            Digite seus dados para entrar.
          </p>

          {erro && (
            <div className="login__erro" role="alert">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login__campo">
              <label htmlFor="email">E-mail</label>

              <div className="login__entrada">
                <IconeEmail />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login__campo">
              <label htmlFor="senha">Senha</label>

              <div className="login__entrada">
                <IconeCadeado />

                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="login__mostrar-senha"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                >
                  <IconeOlho riscado={mostrarSenha} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login__botao"
              disabled={entrando}
            >
              <span>{entrando ? "Entrando..." : "Entrar"}</span>
              <IconeSeta />
            </button>
          </form>

          <button
            type="button"
            className="login__redefinir"
            onClick={() => navigate("/redefinir-senha")}
          >
            Redefinir senha
          </button>
        </div>
      </main>
    </div>
  );
}

export default Login;
