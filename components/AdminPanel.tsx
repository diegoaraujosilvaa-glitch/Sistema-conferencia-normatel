
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  UserPlus, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  Key, 
  Search, 
  UserCheck,
  ShieldCheck,
  BadgeAlert,
  X,
  Lock,
  Save
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (user: User) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, currentUser, onAddUser, onDeleteUser, onUpdateUser }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({ 
    name: '', 
    username: '', 
    role: UserRole.CONFERENTE, 
    password: '' 
  });

  // IDs de usuários que não podem ser excluídos por segurança do sistema
  const PROTECTED_IDS = ['1', '4'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação extra de segurança para impedir que supervisores criem admins via manipulação de DOM/State
    if (currentUser.role === UserRole.SUPERVISOR && newUser.role === UserRole.ADMIN) {
      alert("Permissão insuficiente para criar um Administrador.");
      return;
    }

    onAddUser({
      id: Math.random().toString(36).substr(2, 9),
      ...newUser
    });
    setNewUser({ name: '', username: '', role: UserRole.CONFERENTE, password: '' });
    setShowAdd(false);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassUser && newPassword) {
      // Bloqueio de segurança nível execução: Supervisor não altera Admin
      if (currentUser.role === UserRole.SUPERVISOR && resetPassUser.role === UserRole.ADMIN) {
        alert("Operação não permitida: Supervisores não podem alterar senhas de Administradores.");
        setResetPassUser(null);
        return;
      }

      onUpdateUser({ ...resetPassUser, password: newPassword });
      setResetPassUser(null);
      setNewPassword('');
      alert(`Senha de ${resetPassUser.name} redefinida com sucesso!`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
      case UserRole.ADMIN: return <ShieldCheck className="text-purple-500" size={16} />;
      case UserRole.SUPERVISOR: return <Shield className="text-orange-500" size={16} />;
      default: return <UserCheck className="text-blue-500" size={16} />;
    }
  };

  const isProtected = (user: User) => {
    return PROTECTED_IDS.includes(user.id) || user.id === currentUser.id;
  };

  // Regra visual: Supervisor pode resetar apenas quem não é Admin
  const canCurrentUserResetPasswordOf = (targetUser: User) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.SUPERVISOR) {
      return targetUser.role !== UserRole.ADMIN;
    }
    return false;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Controle de Acessos</h3>
          <p className="text-slate-500 text-sm font-medium">Gerencie usuários, perfis e permissões do sistema.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <UserPlus size={20} />
          Cadastrar Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total de Usuários</p>
          <p className="text-3xl font-black text-slate-800">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">Supervisores</p>
          <p className="text-3xl font-black text-slate-800">{users.filter(u => u.role === UserRole.SUPERVISOR).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Conferentes</p>
          <p className="text-3xl font-black text-slate-800">{users.filter(u => u.role === UserRole.CONFERENTE).length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar por nome ou login..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Nome do Usuário</th>
                <th className="px-6 py-4">Perfil / Role</th>
                <th className="px-6 py-4">Login de Acesso</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors`}>
                        <UserIcon size={20} />
                      </div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${
                      u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                      u.role === UserRole.SUPERVISOR ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {getRoleIcon(u.role)}
                      {u.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-slate-50 px-2 py-1 rounded font-mono text-slate-600">{u.username}</code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canCurrentUserResetPasswordOf(u) ? (
                        <button 
                          onClick={() => setResetPassUser(u)}
                          title="Redefinir Senha"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Key size={18} />
                        </button>
                      ) : (
                         <div title="Sem permissão para alterar Admin" className="p-2 text-slate-200 cursor-not-allowed">
                          <Lock size={18} />
                        </div>
                      )}
                      
                      {isProtected(u) ? (
                        <div title="Usuário Protegido pelo Sistema" className="p-2 text-slate-300 cursor-not-allowed">
                          <ShieldCheck size={18} />
                        </div>
                      ) : (
                        <button 
                          onClick={() => onDeleteUser(u.id)}
                          title="Excluir Usuário"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <BadgeAlert size={40} className="opacity-20" />
                      <p className="font-medium">Nenhum usuário encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Redefinir Senha */}
      {resetPassUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Redefinir Senha</h4>
                <p className="text-xs text-slate-500 font-medium">{resetPassUser.name} ({resetPassUser.username})</p>
              </div>
              <button onClick={() => setResetPassUser(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nova Senha</label>
                <input 
                  required
                  autoFocus
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setResetPassUser(null)} 
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Novo Cadastro</h4>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium"
                    placeholder="Ex: João da Silva"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome de Usuário (Login)</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm"
                    placeholder="ex: joao.silva"
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Perfil de Acesso</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold text-slate-700"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                    >
                      <option value={UserRole.CONFERENTE}>Conferente</option>
                      <option value={UserRole.SUPERVISOR}>Supervisor</option>
                      {/* Apenas Admins podem cadastrar outros Admins */}
                      {currentUser.role === UserRole.ADMIN && (
                        <option value={UserRole.ADMIN}>Administrador</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha Inicial</label>
                    <input 
                      required
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)} 
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
