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

import {
  AuthProvider,
  useAuth,
} from "./contexts/AuthContext";


function RotaProtegida({ children }) {
  const {
    autenticado,
    carregando,
  } = useAuth();

  if (carregando) {
    return <p>Carregando...</p>;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="app">

      <header className="header">

        <div className="logo">
          Sistema de Advocacia
        </div>

        <div className="usuario">

          <span>
            {usuario?.nome || "Usuário"}
          </span>

          <button onClick={logout}>
            Sair
          </button>

        </div>

      </header>


      <div className="layout">

        <aside className="sidebar">

          <nav>

            <Link
              to="/"
              className="menu-item"
            >
              Dashboard
            </Link>

            <Link
              to="/clientes"
              className="menu-item"
            >
              Clientes
            </Link>

            <Link
              to="/casos"
              className="menu-item"
            >
              Casos
            </Link>

            <Link
              to="/agenda"
              className="menu-item"
            >
              Agenda
            </Link>

          </nav>

        </aside>


        <main className="content">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/clientes"
              element={<Clientes />}
            />

            <Route
              path="/casos"
              element={<Casos />}
            />

            <Route
              path="/agenda"
              element={<Agenda />}
            />

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
        element={
          autenticado
            ? <Navigate to="/" replace />
            : <Login />
        }
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