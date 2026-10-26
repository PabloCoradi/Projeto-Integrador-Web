
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
import Agenda from "./pages/Agenda/Agenda";
import Login from "./pages/Login/Login";
import Administradores from "./pages/Administradores/Administradores";
import RedefinirSenha from "./pages/RedefinirSenha/RedefinirSenha";

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

function Layout() {
  const { usuario, logout, podeVisualizar } = useAuth();

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

            {podeVisualizar("agenda") && (
              <Link to="/agenda" className="menu-item">Agenda</Link>
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
                : <Navigate to="/clientes" replace />
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

            <Route path="/agenda" element={
              podeVisualizar("agenda")
                ? <Agenda />
                : <Navigate to="/" replace />
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
