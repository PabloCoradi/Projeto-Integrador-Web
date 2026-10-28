
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import "./App.css";

import Dashboard from "./pages/Dashboard/Dashboard";
import Clientes from "./pages/Clientes/Clientes";
import Casos from "./pages/Casos/Casos";
import Login from "./pages/Login/Login";
import Administradores from "./pages/Administradores/Administradores";
import RedefinirSenha from "./pages/RedefinirSenha/RedefinirSenha";
import Artigos from "./pages/Artigos/Artigos";
import ArtigoEditor from "./pages/Artigos/ArtigoEditor";

import {
  AuthProvider,
  useAuth,
} from "./contexts/AuthContext";

function RotaProtegida({ children }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) return <p>Carregando...</p>;
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

// Páginas do menu na ordem em que aparecem. Quem não pode ver o Dashboard
// vai para a primeira página que tem permissão (evita redirecionar em círculo).
const PAGINAS_INICIAIS = [
  { modulo: "clientes", rota: "/clientes" },
  { modulo: "casos", rota: "/casos" },
  { modulo: "artigos", rota: "/artigos" },
];

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

function Layout() {
  const { usuario, logout, podeVisualizar, podeEditar } = useAuth();

  const rotaInicial = PAGINAS_INICIAIS.find((pagina) => podeVisualizar(pagina.modulo))?.rota;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Sistema de Advocacia</div>

        <div className="usuario">
          <span>{usuario?.nome || "Usuário"}</span>
          <button onClick={logout}>Sair</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            {podeVisualizar("dashboard") && (
              <Link to="/" className="menu-item">Dashboard</Link>
            )}

            {podeVisualizar("clientes") && (
              <Link to="/clientes" className="menu-item">Clientes</Link>
            )}

            {podeVisualizar("casos") && (
              <Link to="/casos" className="menu-item">Casos</Link>
            )}

            {podeVisualizar("artigos") && (
              <Link to="/artigos" className="menu-item">Artigos</Link>
            )}

            {usuario?.is_admin && (
              <Link to="/administradores" className="menu-item">
                Administradores
              </Link>
            )}
          </nav>
        </aside>

        <main className="content">
          <Routes>
            <Route path="/" element={
              podeVisualizar("dashboard")
                ? <Dashboard />
                : rotaInicial
                  ? <Navigate to={rotaInicial} replace />
                  : <SemAcesso />
            } />

            <Route path="/clientes" element={
              podeVisualizar("clientes")
                ? <Clientes />
                : <Navigate to="/" replace />
            } />

            <Route path="/casos" element={
              podeVisualizar("casos")
                ? <Casos />
                : <Navigate to="/" replace />
            } />

            <Route path="/artigos" element={
              podeVisualizar("artigos")
                ? <Artigos />
                : <Navigate to="/" replace />
            } />

            <Route path="/artigos/novo" element={
              podeEditar("artigos")
                ? <ArtigoEditor />
                : <Navigate to="/artigos" replace />
            } />

            <Route path="/artigos/:artigoId/editar" element={
              podeEditar("artigos")
                ? <ArtigoEditor />
                : <Navigate to="/artigos" replace />
            } />

            <Route path="/administradores" element={
              <RotaAdministrador>
                <Administradores />
              </RotaAdministrador>
            } />

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
