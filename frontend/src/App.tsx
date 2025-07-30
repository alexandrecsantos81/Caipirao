// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/guards/AuthGuard';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Movimentacoes from './pages/Movimentacoes';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* CORREÇÃO: BrowserRouter agora envolve o AuthProvider */}
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Rota Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rotas Privadas com Layout de Dashboard */}
            <Route 
              path="/" 
              element={
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Dashboard />} /> 
              <Route path="movimentacoes" element={<Movimentacoes />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="produtos" element={<Produtos />} />
            </Route>

            {/* Rota de fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
