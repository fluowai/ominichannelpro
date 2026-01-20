
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  Share2, 
  Settings, 
  Users, 
  Bell,
  Search,
  Zap,
  Send,
  LogOut,
  ShieldCheck,
  Home,
  Contact,
  Download,
  Kanban as KanbanIcon,
  Instagram as InstagramIcon
} from 'lucide-react';
// Imports para Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTenants from './pages/admin/AdminTenants';
import AdminPlans from './pages/admin/AdminPlans';

import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Agents from './pages/Agents';
import Properties from './pages/Properties';
import Integrations from './pages/Integrations';
import Broadcast from './pages/Broadcast';
import UserSettings from './pages/UserSettings';
import Login from './pages/Login';
import Contacts from './pages/Contacts';
import GroupImport from './pages/GroupImport';
import Kanban from './pages/Kanban';
import Instagram from './pages/Instagram';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { Toaster } from 'react-hot-toast';

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 mb-2 ${
      active ? 'bg-orange-50 text-orange-600 font-semibold soft-shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="tracking-tight">{label}</span>
  </Link>
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
 
  const handleLogout = async () => {
    await logout();
    window.location.href = '/#/login';
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-['Poppins'] selection:bg-orange-100 selection:text-orange-900">
      <Toaster position="top-right" />
      
      {/* Sidebar - Higher airiness */}
      <aside className="w-80 bg-white border-r border-slate-50 flex-col hidden lg:flex z-20">
        <div className="p-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl shadow-slate-200">
              <span className="text-orange-500">F</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tighter">Fluow AI</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-6 py-4 overflow-y-auto no-scrollbar">
          <p className="px-6 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu Principal</p>
          <SidebarItem icon={LayoutDashboard} label="Painel" to="/" active={location.pathname === '/'} />
          <SidebarItem icon={MessageSquare} label="Conversas" to="/chat" active={location.pathname === '/chat'} />
          <SidebarItem icon={Home} label="Imóveis" to="/properties" active={location.pathname === '/properties'} />
          <SidebarItem icon={Bot} label="Builder Agentes" to="/agents" active={location.pathname === '/agents'} />
          
          <p className="px-6 mt-10 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">CRM</p>
          <SidebarItem icon={Contact} label="Contatos" to="/contacts" active={location.pathname === '/contacts'} />
          <SidebarItem icon={Download} label="Importar Grupos" to="/group-import" active={location.pathname === '/group-import'} />
          <SidebarItem icon={KanbanIcon} label="Kanban" to="/kanban" active={location.pathname === '/kanban'} />
          
          <p className="px-6 mt-10 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Marketing</p>
          <SidebarItem icon={Share2} label="Integrações" to="/integrations" active={location.pathname === '/integrations'} />
          <SidebarItem icon={InstagramIcon} label="Instagram Hub" to="/instagram" active={location.pathname === '/instagram'} />
          <SidebarItem icon={Send} label="Disparador" to="/broadcast" active={location.pathname === '/broadcast'} />

          {/* Super Admin Section */}
          {user?.role === 'SUPER_ADMIN' && (
            <>
               <p className="px-6 mt-10 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Admin</p>
               <SidebarItem 
                  icon={ShieldCheck} 
                  label="Super Admin" 
                  to="/admin/dashboard" 
                  active={location.pathname.startsWith('/admin')} 
               />
            </>
          )}
        </nav>

        <div className="p-8 mt-auto space-y-2">
          <SidebarItem icon={Settings} label="Configurações" to="/settings" active={location.pathname === '/settings'} />
          <div className="flex items-center gap-3 px-6 py-2 text-xs font-semibold text-slate-400 bg-slate-50/50 rounded-xl mb-2">
            <div className={`w-2 h-2 rounded-full ${useChatStore().socket?.readyState === WebSocket.OPEN ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{useChatStore().socket?.readyState === WebSocket.OPEN ? 'Sistema Online' : 'Desconectado'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="tracking-tight">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center flex-1 max-w-3xl">
            <div className="relative w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar em toda a plataforma..." 
                className="w-full bg-slate-50 border-none rounded-[1.25rem] pl-14 pr-6 py-4 text-base focus:ring-2 focus:ring-orange-100 transition-all outline-none font-medium placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-8 ml-8">
            <div className="flex items-center gap-2">
                <button className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all">
                  <Zap size={22} />
                </button>
                <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl relative transition-all">
                  <Bell size={22} />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                </button>
            </div>
            
            <div className="flex items-center gap-4 pl-8 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.role || 'Agent'}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-bold shadow-xl shadow-slate-100 ring-4 ring-slate-50">
                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const connectWebSocket = useChatStore((state) => state.connectWebSocket);
  const disconnectWebSocket = useChatStore((state) => state.disconnectWebSocket);

  // Global WebSocket connection - stable across navigation
  useEffect(() => {
    if (accessToken && user?.id) {
      console.log('[Global] Initializing WebSocket...');
      connectWebSocket(accessToken, user.id);
    }
    return () => {
      console.log('[Global] Cleanup WebSocket...');
      disconnectWebSocket();
    };
  }, [accessToken, user?.id, connectWebSocket, disconnectWebSocket]);

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="plans" element={<AdminPlans />} />
        </Route>

        {/* Regular Routes */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <AppLayout>
                <Chat />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <PrivateRoute>
              <AppLayout>
                <Agents />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/properties"
          element={
            <PrivateRoute>
              <AppLayout>
                <Properties />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <PrivateRoute>
              <AppLayout>
                <Integrations />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/instagram"
          element={
            <PrivateRoute>
              <AppLayout>
                <Instagram />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/broadcast"
          element={
            <PrivateRoute>
              <AppLayout>
                <Broadcast />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <AppLayout>
                <UserSettings />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <AppLayout>
                <Contacts />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/group-import"
          element={
            <PrivateRoute>
              <AppLayout>
                <GroupImport />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/kanban"
          element={
            <PrivateRoute>
              <AppLayout>
                <Kanban />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
