// frontend/src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet /> {/* As páginas (Dashboard, Clientes, etc.) serão renderizadas aqui */}
      </main>
    </div>
  );
}
