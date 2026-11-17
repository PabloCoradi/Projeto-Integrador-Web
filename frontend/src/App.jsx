import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "./App.css";

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
      <div className="app-loading">
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
      <h2>Sem acesso</h2>
      <p>
        Seu usuário ainda não tem permissão para nenhuma área do sistema.
        Peça a um administrador para liberar o acesso.
      </p>
    </div>
  );
}

function Marca() {
  return (
    <div className="brand-lockup" aria-label="Giongo & Raguzzoni">
      <span className="brand-lockup__accent" aria-hidden="true" />
      <span>
        GIONGO &amp;
        <br />
        RAGUZZONI
      </span>
    </div>
  );
}

function Sidebar({ aberta, aoFechar }) {
  const { usuario, podeVisualizar } = useAuth();

  return (
    <>
      <button
        className={`sidebar-scrim ${aberta ? "is-open" : ""}`}
        type="button"
        aria-label="Fechar menu"
        onClick={aoFechar}
      />

      <aside className={`sidebar ${aberta ? "is-open" : ""}`}>
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

function Topbar({ pagina, aoAbrirMenu }) {
  const { usuario, logout } = useAuth();
  const inicial = usuario?.nome?.trim()?.[0]?.toUpperCase() || "U";

  return (
    <header className="topbar">
      <button
        className="topbar__menu"
        type="button"
        onClick={aoAbrirMenu}
        aria-label="Abrir menu"
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
        <button
          type="button"
          className="button button--quiet topbar__logout"
          onClick={logout}
        >
          Sair
        </button>
      </div>
    </header>
  );
}

function Layout() {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
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
    <div className="app">
      <Sidebar aberta={menuAberto} aoFechar={() => setMenuAberto(false)} />

      <div className="workspace">
        <Topbar pagina={pagina} aoAbrirMenu={() => setMenuAberto(true)} />

        <main className="content">
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
                  <Casos />
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