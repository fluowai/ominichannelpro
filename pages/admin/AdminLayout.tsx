import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  LogOut, 
  ShieldCheck,
  Menu,
  X,
  Package
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore(state => state.logout);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Visão Geral', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'Usuários', path: '/admin/tenants' },
    { icon: <Package size={20} />, label: 'Planos', path: '/admin/plans' },
    { icon: <Settings size={20} />, label: 'Configurações Globais', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-['Poppins']">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">SUPER ADMIN</h1>
                <p className="text-xs text-slate-400 font-medium tracking-wider">FLUOW AI S.A.</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 font-medium ${
                  location.pathname === item.path
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 translate-x-1'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-slate-400 hover:bg-slate-800 hover:text-white mt-8"
                            >
                                <LogOut size={20} className="rotate-180" />
                                <span>Voltar ao Sistema</span>
                            </button>
                        </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair do Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-500 rounded-lg">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <span className="font-black text-slate-900">SUPER ADMIN</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
