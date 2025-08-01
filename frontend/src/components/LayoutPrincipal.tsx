// /frontend/src/components/LayoutPrincipal.tsx

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // 1. useAuth já está importado, vamos usá-lo

// 2. Importa os ícones necessários, incluindo LogOut e o componente Button
import { Home, Users, Package, DollarSign, LogOut } from 'lucide-react';
import { Button } from './ui/button';

export function LayoutPrincipal() {
  // 3. Obtém a função de logout e o estado de autenticação
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <NavLink to="/login" replace />;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      
      {/* ===== Coluna do Menu Lateral (Sidebar) ===== */}
      <div className="hidden border-r bg-muted/40 md:block">
        {/* 4. Adicionado 'flex flex-col' para permitir que o botão de logout vá para o final */}
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span>Caipirão 2.0</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink to="/clientes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                <Users className="h-4 w-4" />
                Clientes
              </NavLink>
              <NavLink to="/movimentacoes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                <DollarSign className="h-4 w-4" />
                Movimentações
              </NavLink>
              <NavLink to="/produtos" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                <Package className="h-4 w-4" />
                Produtos
              </NavLink>
            </nav>
          </div>

          {/* 5. Botão de Logout adicionado na parte inferior da barra lateral */}
          <div className="mt-auto p-4">
            <Button onClick={logout} variant="ghost" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

        </div>
      </div>

      {/* ===== Coluna do Conteúdo Principal ===== */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            {/* Pode ter um campo de busca aqui no futuro */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
