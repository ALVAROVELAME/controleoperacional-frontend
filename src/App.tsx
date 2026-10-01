import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Status from './pages/Status';
import ConfirmarEmail from './pages/ConfirmarEmail';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import { AuthProvider } from './contexts/AuthContext';
import RotaProtegida from './components/RotaProtegida';
import RotaPublica from './components/RotaPublica';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ============ ROTAS PÚBLICAS ============ */}
          <Route
            path="/"
            element={
              <RotaPublica>
                <Landing />
              </RotaPublica>
            }
          />
          <Route
            path="/login"
            element={
              <RotaPublica>
                <Login />
              </RotaPublica>
            }
          />
          <Route
            path="/signup"
            element={
              <RotaPublica>
                <Signup />
              </RotaPublica>
            }
          />

          {/* ============ PÁGINAS DE STATUS (sempre acessíveis) ============ */}
          <Route path="/status" element={<Status />} />
          <Route path="/confirmar" element={<ConfirmarEmail />} />

          {/* ============ PÁGINAS LEGAIS (sempre acessíveis) ============ */}
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />

          {/* ============ ROTAS PROTEGIDAS ============ */}
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />

          {/* ============ FALLBACK ============ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}