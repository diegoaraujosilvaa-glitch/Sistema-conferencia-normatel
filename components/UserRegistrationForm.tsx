
import React, { useState } from 'react';
import { UserRole } from '../types';
import { UserPlus, Save, X } from 'lucide-react';
import { cadastrarUsuarioConferente } from '../src/services/userService';

interface UserRegistrationFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CONFERENTE);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Utilizando a nova função de cadastro que resolve o problema de campos vazios e trata erros de permissão
      await cadastrarUsuarioConferente({
        name: name,
        username: username,
        role: role,
        password: password
      });
      
      // Limpar formulário
      setName('');
      setUsername('');
      setRole(UserRole.CONFERENTE);
      setPassword('');
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      // O erro já é tratado dentro da função cadastrarUsuarioConferente com alertas
      console.error("Erro no formulário de cadastro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <UserPlus size={24} className="text-blue-600" />
          Novo Cadastro (Firestore)
        </h4>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome de Usuário (Login)</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm"
              placeholder="ex: joao.silva"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Perfil de Acesso</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold text-slate-700"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
              >
                <option value={UserRole.CONFERENTE}>Conferente</option>
                <option value={UserRole.SUPERVISOR}>Supervisor</option>
                <option value={UserRole.ADMIN}>Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha Inicial</label>
              <input 
                required
                type="password"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          {onClose && (
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-6 py-4 rounded-md font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-md font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserRegistrationForm;
