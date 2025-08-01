// /frontend/src/components/layout/AppSidebar.tsx

import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Users, Package, LogOut } from 'lucide-react'; // 1. Importa o ícone LogOut
import { useAuth } from '@/contexts/AuthContext'; // 2. Importa o hook useAuth
import { Button } from '@/components/ui/button'; // Importa o componente Button

const navLinks = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/movimentacoes", label: "Movimentações", icon: ShoppingCart },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/produtos", label: "Produtos", icon: Package },
];

export default function AppSidebar() {
  // 3. Obtém a função logout do contexto de autenticação
  const { logout } = useAuth();

  return (
    // Aumenta a altura mínima da tela para garantir que o botão de logout fique no fundo
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white p-4 flex flex-col min-h-screen">
      <div>
        <div className="text-2xl font-bold mb-8">Caipirão 2.0</div>
        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <link.icon className="mr-3 h-5 w-5" />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 4. Adiciona o botão de Logout na parte inferior */}
      <div className="mt-auto">
        <Button
          onClick={logout}
          variant="ghost" // Estilo sutil que combina com a sidebar
          className="w-full justify-start text-gray-300 hover:bg-red-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
