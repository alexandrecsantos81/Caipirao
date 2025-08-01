// /frontend/src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. IMPORTAR O TANSTACK QUERY
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Importe seus providers e componentes
import { AuthProvider } from './contexts/AuthContext'; 
import { LayoutPrincipal } from './components/LayoutPrincipal'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Movimentacoes from './pages/Movimentacoes';
import Produtos from './pages/Produtos';

// 2. CRIAR UMA INSTÂNCIA DO CLIENTE
const queryClient = new QueryClient();

function App() {
  return (
    <>
      <Router>
        {/* 3. ENVOLVER A APLICAÇÃO COM O PROVIDER */}
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<LayoutPrincipal />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/movimentacoes" element={<Movimentacoes />} />
                <Route path="/produtos" element={<Produtos />} />
              </Route>
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
      
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </>
  );
}

export default App;
