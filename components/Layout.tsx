
import React from 'react';
import { 
  LayoutDashboard, 
  FileUp, 
  ClipboardCheck, 
  History, 
  Users, 
  LogOut,
  PackageCheck,
  Shield,
  PauseCircle,
  Building2
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  pausedCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, activeTab, setActiveTab, children, pausedCount = 0 }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONFERENTE] },
    { id: 'upload', label: 'Importar XML', icon: FileUp, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONFERENTE] },
    { id: 'checking', label: 'Conferência', icon: ClipboardCheck, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONFERENTE] },
    { id: 'paused', label: 'Pausadas', icon: PauseCircle, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONFERENTE], badge: pausedCount },
    { id: 'history', label: 'Manifestos', icon: History, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONFERENTE] },
    { id: 'branches', label: 'Filiais', icon: Building2, roles: [UserRole.ADMIN, UserRole.SUPERVISOR] },
    { id: 'admin', label: 'Colaboradores', icon: Users, roles: [UserRole.ADMIN, UserRole.SUPERVISOR] },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex flex-col items-center gap-1 border-b border-slate-800/50">
          <div className="bg-[#E66B27] p-2 rounded-xl mb-2">
            <PackageCheck className="text-white" size={28} />
          </div>
          <span className="font-black text-sm tracking-[0.2em] uppercase text-white">Normatel</span>
          <span className="text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase">Conferência</span>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-1">
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  activeTab === item.id 
                  ? 'bg-[#E66B27] text-white shadow-lg shadow-orange-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="bg-slate-800/30 rounded-2xl p-4 mb-4 border border-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={12} className={user.role === UserRole.CONFERENTE ? 'text-[#E66B27]' : 'text-orange-400'} />
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Acesso Autorizado</p>
            </div>
            <p className="text-xs font-black truncate text-slate-100 uppercase tracking-tight">{user.name}</p>
            <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest">{user.role}</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400/80 hover:bg-red-500/10 rounded-xl transition-all hover:text-red-500"
          >
            <LogOut size={16} />
            <span className="font-black text-[10px] uppercase tracking-widest">Finalizar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E66B27]"></div>
            {menuItems.find(i => i.id === activeTab)?.label || 'Visão Geral'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 uppercase tracking-widest">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-[#fbfcfd]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
