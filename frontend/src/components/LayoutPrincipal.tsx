// /frontend/src/components/LayoutPrincipal.tsx

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Package, DollarSign, LogOut, UserCircle, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge'; // Importar o Badge

export function LayoutPrincipal() {
  // 1. Obter o 'user' além das outras propriedades
  const { isAuthenticated, logout, user } = useAuth();

  if (!isAuthenticated) {
    return <NavLink to="/login" replace />;
  }

  return (
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span>Caipirão 2.0</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
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

          {/* 2. Área do Usuário e Logout Atualizada */}
          <div className="mt-auto p-4 border-t">
            {user && (
              <div className="flex items-center gap-3 mb-4">
                <UserCircle className="h-8 w-8 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{user.email}</span>
                  {user.perfil === 'ADMIN' && (
                    <Badge variant="destructive" className="mt-1 w-fit">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <Button onClick={logout} variant="ghost" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

        </div>
      </div>

      <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1"></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
