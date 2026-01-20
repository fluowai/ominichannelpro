import React from 'react';
import { 
  MessageSquare, 
  AtSign, 
  AlertCircle, 
  Inbox, 
  Tag, 
  BarChart3, 
  Users, 
  Settings,
  HelpCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const GlobalSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { icon: MessageSquare, label: 'Conversas', path: '/chat' },
    { icon: AtSign, label: 'Menções', path: '/mentions', badge: 3 },
    { icon: AlertCircle, label: 'Não atendidas', path: '/unattended', badge: 5 },
    { icon: Inbox, label: 'Caixas', path: '/inboxes' },
    { icon: Tag, label: 'Marcadores', path: '/labels' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
    { icon: Users, label: 'Contatos', path: '/contacts' },
  ];

  const bottomItems: NavItem[] = [
    { icon: HelpCircle, label: 'Ajuda', path: '/help' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
          F
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative group flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                active 
                  ? 'bg-primary-100 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={item.label}
            >
              <Icon size={22} />
              
              {/* Badge */}
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="flex flex-col gap-2 w-full px-2 mb-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative group flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                active 
                  ? 'bg-primary-100 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={item.label}
            >
              <Icon size={22} />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* User Avatar */}
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:ring-2 ring-primary-200 transition-all">
          PA
        </div>
      </div>
    </aside>
  );
};

export default GlobalSidebar;
