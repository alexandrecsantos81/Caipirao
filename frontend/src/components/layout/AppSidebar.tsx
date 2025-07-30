// frontend/src/components/layout/AppSidebar.tsx
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Users, Package } from 'lucide-react'; // Ícones

const navLinks = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/movimentacoes", label: "Movimentações", icon: ShoppingCart },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/produtos", label: "Produtos", icon: Package },
];

export default function AppSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white p-4">
      <div className="text-2xl font-bold mb-8">Caipirão 2.0</div>
      <nav>
        <ul>
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end // 'end' garante que o link só fica ativo na URL exata
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
    </aside>
  );
}
