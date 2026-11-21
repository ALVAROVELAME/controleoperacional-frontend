import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { lazy, Suspense } from 'react';
import CarregandoSessao from './components/CarregandoSessao';
import Status from './pages/Status';
import ConfirmarEmail from './pages/ConfirmarEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import { AuthProvider } from './contexts/AuthProvider';
import RotaProtegida from './components/RotaProtegida';
import RotaPublica from './components/RotaPublica';

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