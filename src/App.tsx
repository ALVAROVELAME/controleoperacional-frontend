import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { lazy, Suspense } from 'react';
import CarregandoSessao from './components/auth/CarregandoSessao';
import Status from './pages/Status';
import ConfirmarEmail from './pages/auth/ConfirmarEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Termos from './pages/legal/Termos';
import Privacidade from './pages/legal/Privacidade';
import { AuthProvider } from './contexts/AuthProvider';
import RotaProtegida from './components/auth/RotaProtegida';
import RotaPublica from './components/auth/RotaPublica';

const Dashboard = lazy(() => import('./pages/Dashboard'));

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

          {/* ============ RECUPERAÇÃO DE SENHA ============ */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />

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
                <Suspense fallback={<CarregandoSessao />}><Dashboard /></Suspense>
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