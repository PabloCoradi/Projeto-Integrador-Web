
import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "./App.css";

import { apiRequest } from "./services/api";

import Dashboard from "./pages/Dashboard/Dashboard";
import Clientes from "./pages/Clientes/Clientes";
import Casos from "./pages/Casos/Casos";
import Artigos from "./pages/Artigos/Artigos";
import ArtigoEditor from "./pages/Artigos/ArtigoEditor";
import Login from "./pages/Login/Login";
import Administradores from "./pages/Administradores/Administradores";
import RedefinirSenha from "./pages/RedefinirSenha/RedefinirSenha";

import { AuthProvider, useAuth } from "./contexts/AuthContext";

import dashboardActive from "./assets/panel/dashboard-active.svg";
import dashboardInactive from "./assets/panel/dashboard-inactive.svg";
import clientsActive from "./assets/panel/clients-active.svg";
import clientsInactive from "./assets/panel/clients-inactive.svg";
import casesActive from "./assets/panel/cases-active.svg";
import casesInactive from "./assets/panel/cases-inactive.svg";
import articlesActive from "./assets/panel/articles-active.svg";
import articlesInactive from "./assets/panel/articles-inactive.svg";
import restrictedIcon from "./assets/panel/restricted.svg";
import logoEscritorio from "./assets/login/logo-giongo-raguzzoni.svg";

const NAVEGACAO = [
  {
    to: "/",
    modulo: "dashboard",
    label: "Dashboard",
    activeIcon: dashboardActive,
    inactiveIcon: dashboardInactive,
    end: true,
  },
  {
    to: "/clientes",
    modulo: "clientes",
    label: "Clientes",
    activeIcon: clientsActive,
    inactiveIcon: clientsInactive,
  },
  {
    to: "/casos",
    modulo: "casos",
    label: "Casos",
    activeIcon: casesActive,
    inactiveIcon: casesInactive,
  },
  {
    to: "/artigos",
    modulo: "artigos",
    label: "Artigos",
    activeIcon: articlesActive,
    inactiveIcon: articlesInactive,
  },
];

// Ordem das páginas usadas como início quando o usuário não vê o Dashboard.
const PAGINAS_INICIAIS = [
  { modulo: "clientes", rota: "/clientes" },
  { modulo: "casos", rota: "/casos" },
  { modulo: "artigos", rota: "/artigos" },
];

function RotaProtegida({ children }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <p>Carregando o painel...</p>
      </div>
    );
  }

  if (!autenticado) return <Navigate to="/login" replace />;

  return children;
}

function RotaAdministrador({ children }) {
  const { usuario } = useAuth();

  if (!usuario?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function SemAcesso() {
  return (
    <div className="content-card">
      <h1>Sem acesso</h1>
      <p>
        Seu usuário ainda não tem permissão para nenhuma área do sistema.
        Peça a um administrador para liberar o acesso.
      </p>
    </div>
  );
}

function Marca() {
  return (
    <div className="brand-lockup">
      <img src={logoEscritorio} alt="Giongo & Raguzzoni" width="209" height="59" />
    </div>
  );
}

function Sidebar({ aberta, aoFechar, mobile, compacta, aoAlternarCompacta }) {
  const { usuario, podeVisualizar } = useAuth();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!aberta || !mobile) return undefined;

    sidebarRef.current?.querySelector("a")?.focus();
    const aoTeclar = (event) => {
      if (event.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta, mobile, aoFechar]);

  return (
    <>
      <button
        className={`sidebar-scrim ${aberta ? "is-open" : ""}`}
        type="button"
        aria-label="Fechar menu"
        aria-hidden={!aberta}
        tabIndex={aberta ? 0 : -1}
        onClick={aoFechar}
      />

      <aside
        id="navigation-sidebar"
        ref={sidebarRef}
        className={`sidebar ${aberta ? "is-open" : ""} ${compacta ? "is-collapsed" : ""}`}
        role={mobile && aberta ? "dialog" : undefined}
        aria-label={mobile && aberta ? "Menu principal" : undefined}
        aria-modal={mobile && aberta ? true : undefined}
        aria-hidden={mobile && !aberta}
        inert={mobile && !aberta}
        onKeyDown={(event) => {
          if (!mobile || !aberta || event.key !== "Tab") return;
          const focaveis = sidebarRef.current?.querySelectorAll('a[href], button:not(:disabled)');
          if (!focaveis?.length) return;
          const primeiro = focaveis[0];
          const ultimo = focaveis[focaveis.length - 1];
          if (event.shiftKey && document.activeElement === primeiro) {
            event.preventDefault();
            ultimo.focus();
          } else if (!event.shiftKey && document.activeElement === ultimo) {
            event.preventDefault();
            primeiro.focus();
          }
        }}
      >
        {!mobile && (
          <button
            className="sidebar__collapse"
            type="button"
            onClick={aoAlternarCompacta}
            aria-label={compacta ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-expanded={!compacta}
            title={compacta ? "Expandir menu" : "Recolher menu"}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14">
              <path
                d={compacta ? "M6 3l5 5-5 5" : "M10 3 5 8l5 5"}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        )}
        <Marca />
        <p className="sidebar__product">PAINEL ADMINISTRATIVO</p>
        <div className="sidebar__divider" />
        <p className="sidebar__section">NAVEGAÇÃO</p>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          {NAVEGACAO.filter((item) => podeVisualizar(item.modulo)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={compacta ? item.label : undefined}
              onClick={aoFechar}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "is-active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <img
                    src={isActive ? item.activeIcon : item.inactiveIcon}
                    alt=""
                    width="24"
                    height="24"
                  />
                  <span>{item.label}</span>
                  {isActive && <i aria-hidden="true" />}
                </>
              )}
            </NavLink>
          ))}

          {usuario?.is_admin && (
            <NavLink
              to="/administradores"
              title="Administradores"
              aria-label={compacta ? "Administradores" : undefined}
              onClick={aoFechar}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "is-active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <img src={restrictedIcon} alt="" width="24" height="24" />
                  <span>Administradores</span>
                  {isActive && <i aria-hidden="true" />}
                </>
              )}
            </NavLink>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__divider" />
          <p className="sidebar__restricted">
            <img src={restrictedIcon} alt="" width="24" height="24" />
            Acesso restrito
          </p>
          <p className="sidebar__office">Giongo &amp; Raguzzoni</p>
        </div>
      </aside>
    </>
  );
}

function Topbar({ pagina, aoAbrirMenu, aoAlterarSenha, refBotaoMenu, menuAberto }) {
  const { usuario, logout } = useAuth();
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);

  const inicial = usuario?.nome?.trim()?.[0]?.toUpperCase() || "U";

  return (
    <header className="topbar">
      <button
        ref={refBotaoMenu}
        className="topbar__menu"
        type="button"
        onClick={aoAbrirMenu}
        aria-label="Abrir menu"
        aria-expanded={menuAberto}
        aria-controls="navigation-sidebar"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="topbar__breadcrumb">
        <span>PAINEL ADMINISTRATIVO</span>
        <strong>{pagina}</strong>
      </div>

      <div className="topbar__session">
        <span className="topbar__session-divider" />

        <span className="topbar__avatar">{inicial}</span>

        <span className="topbar__user">
          <strong>{usuario?.nome || "Usuário autenticado"}</strong>
          <small>Sessão ativa</small>
        </span>

        <div className="topbar__user-menu">
          <button
            type="button"
            className="button button--quiet topbar__logout"
            onClick={() => setMenuUsuarioAberto((aberto) => !aberto)}
            aria-expanded={menuUsuarioAberto}
            aria-haspopup="true"
            aria-controls={menuUsuarioAberto ? "menu-conta" : undefined}
          >
            Conta ▾
          </button>

          {menuUsuarioAberto && (
            <div className="topbar__dropdown" id="menu-conta">
              <button
                type="button"
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  aoAlterarSenha();
                }}
              >
                Alterar minha senha
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  logout();
                }}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ModalAlterarSenha({ aoFechar }) {
  const dialogRef = useRef(null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const focoAnterior = document.activeElement;
    dialogRef.current?.querySelector("input")?.focus();

    function conterFoco(event) {
      if (event.key === "Escape") {
        aoFechar();
        return;
      }

      if (event.key !== "Tab") return;
      const focaveis = dialogRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled)'
      );
      if (!focaveis?.length) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", conterFoco);
    return () => {
      document.removeEventListener("keydown", conterFoco);
      focoAnterior?.focus?.();
    };
  }, [aoFechar]);

  async function handleSubmit(evento) {
    evento.preventDefault();

    setErro("");
    setSucesso("");

    if (novaSenha !== confirmarSenha) {
      setErro("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (senhaAtual === novaSenha) {
      setErro("A nova senha deve ser diferente da atual.");
      return;
    }

    try {
      setSalvando(true);

      const resposta = await apiRequest("/api/auth/alterar-minha-senha", {
        method: "POST",
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
          confirmar_senha: confirmarSenha,
        }),
      });

      setSucesso(resposta.message || "Senha alterada com sucesso!");

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      setErro(error.message || "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="senha-modal-overlay">
      <div
        ref={dialogRef}
        className="senha-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="senha-modal-titulo"
      >
        <button
          type="button"
          className="senha-modal__fechar"
          onClick={aoFechar}
          aria-label="Fechar"
        >
          ×
        </button>

        <h2 id="senha-modal-titulo">Alterar minha senha</h2>

        <p>Informe sua senha atual e escolha uma nova senha.</p>

        {erro && <div className="error-message" role="alert">{erro}</div>}
        {sucesso && <div className="success-message" role="status" aria-live="polite">{sucesso}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="senha-atual">Senha atual</label>
            <input
              id="senha-atual"
              name="senha_atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nova-senha">Nova senha</label>
            <input
              id="nova-senha"
              name="nova_senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmar-senha">Confirmar nova senha</label>
            <input
              id="confirmar-senha"
              name="confirmar_senha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={aoFechar}
              disabled={salvando}
            >
              Fechar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={salvando}
            >
              {salvando ? "Salvando…" : "Alterar senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Layout() {
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);
  const [sidebarCompacta, setSidebarCompacta] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [viewportMobile, setViewportMobile] = useState(() =>
    window.matchMedia("(max-width: 900px)").matches
  );
  const botaoMenuRef = useRef(null);

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 900px)");
    const atualizar = () => setViewportMobile(consulta.matches);
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  const { podeVisualizar, podeEditar } = useAuth();

  const rotaInicial = PAGINAS_INICIAIS.find((pagina) =>
    podeVisualizar(pagina.modulo)
  )?.rota;

  const pagina = location.pathname.startsWith("/administradores")
    ? "Administradores"
    : NAVEGACAO.find((item) =>
        item.end
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)
      )?.label || "Painel";

  return (
    <div className={`app ${sidebarCompacta && !viewportMobile ? "app--sidebar-collapsed" : ""}`}>
      <Sidebar
        aberta={menuAberto}
        mobile={viewportMobile}
        compacta={sidebarCompacta && !viewportMobile}
        aoAlternarCompacta={() => setSidebarCompacta((compacta) => !compacta)}
        aoFechar={() => {
          setMenuAberto(false);
          if (viewportMobile) {
            requestAnimationFrame(() => botaoMenuRef.current?.focus());
          }
        }}
      />

      <div className="workspace" inert={menuAberto && viewportMobile}>
        <Topbar
          pagina={pagina}
          aoAbrirMenu={() => setMenuAberto(true)}
          aoAlterarSenha={() => setModalSenhaAberto(true)}
          refBotaoMenu={botaoMenuRef}
          menuAberto={menuAberto}
        />

        {modalSenhaAberto && (
          <ModalAlterarSenha
            aoFechar={() => setModalSenhaAberto(false)}
          />
        )}

        <a className="skip-link" href="#conteudo-principal">
          Pular para o conteúdo
        </a>

        <main className="content" id="conteudo-principal" tabIndex={-1}>
          <Routes>
            <Route
              path="/"
              element={
                podeVisualizar("dashboard") ? (
                  <Dashboard />
                ) : rotaInicial ? (
                  <Navigate to={rotaInicial} replace />
                ) : (
                  <SemAcesso />
                )
              }
            />

            <Route
              path="/clientes"
              element={
                podeVisualizar("clientes") ? (
                  <Clientes />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/casos"
              element={
                podeVisualizar("casos") ? (
                  <Casos key={location.key} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/artigos"
              element={
                podeVisualizar("artigos") ? (
                  <Artigos />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/artigos/novo"
              element={
                podeEditar("artigos") ? (
                  <ArtigoEditor />
                ) : (
                  <Navigate to="/artigos" replace />
                )
              }
            />

            <Route
              path="/artigos/:artigoId/editar"
              element={
                podeEditar("artigos") ? (
                  <ArtigoEditor />
                ) : (
                  <Navigate to="/artigos" replace />
                )
              }
            />

            <Route
              path="/administradores"
              element={
                <RotaAdministrador>
                  <Administradores />
                </RotaAdministrador>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { autenticado } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={autenticado ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/redefinir-senha"
        element={<RedefinirSenha />}
      />

      <Route
        path="/*"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
