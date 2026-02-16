
import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Info, Lock, User as UserIcon } from 'lucide-react';
import { ConferenceBatch, User, UserRole } from '../types';

interface SupervisorCheckProps {
  batch: ConferenceBatch;
  users: User[];
  onApprove: (supervisor: User, justification: string) => void;
  onReject: () => void;
}

const SupervisorCheck: React.FC<SupervisorCheckProps> = ({ batch, users, onApprove, onReject }) => {
  const [supervisorUser, setSupervisorUser] = useState('');
  const [supervisorPass, setSupervisorPass] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');
  const [validatedUser, setValidatedUser] = useState<User | null>(null);

  const discrepancies = batch.products.filter(p => p.quantityExpected !== p.quantityChecked);

  const handleValidate = () => {
    const found = users.find(u => 
      (u.role === UserRole.SUPERVISOR || u.role === UserRole.ADMIN) && 
      u.username.toLowerCase() === supervisorUser.toLowerCase() &&
      u.password === supervisorPass
    );
    
    if (found) {
      setValidatedUser(found);
      setError('');
    } else {
      setError('Acesso negado. Usuário/senha inválidos ou perfil sem permissão de supervisor.');
    }
  };

  const submitApproval = () => {
    if (!justification.trim()) {
      setError('A justificativa é obrigatória para aprovação com divergência.');
      return;
    }
    if (validatedUser) {
      onApprove(validatedUser, justification);
    }
  };

  if (!validatedUser) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-orange-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Validação Requerida</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Apenas supervisores podem autorizar divergências.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 text-orange-800 text-sm">
            <AlertCircle size={20} className="shrink-0" />
            <p>O lote contém diferenças entre o XML e o físico. Insira credenciais de supervisor.</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={supervisorUser}
                onChange={(e) => setSupervisorUser(e.target.value)}
                placeholder="Login do Supervisor"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                value={supervisorPass}
                onChange={(e) => setSupervisorPass(e.target.value)}
                placeholder="Senha"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl">{error}</p>}

          <button
            onClick={handleValidate}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            Autorizar como Supervisor
          </button>
          
          <button
            onClick={onReject}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-4 rounded-xl font-bold transition-all"
          >
            Voltar para Conferência
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Análise de Divergências</h2>
            <p className="text-slate-500 font-medium">Validado por: <span className="text-orange-600 font-bold">{validatedUser.name}</span></p>
          </div>
          <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Info size={16} />
            Divergência Crítica
          </span>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-2xl mb-8 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">XML (Faturado)</th>
                <th className="px-6 py-4 text-center">Físico (Lido)</th>
                <th className="px-6 py-4 text-center">Diferença</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {discrepancies.map((p) => {
                const diff = p.quantityChecked - p.quantityExpected;
                const isSobra = diff > 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{p.description}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.ean}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-600">{p.quantityExpected}</td>
                    <td className="px-6 py-4 text-center font-black text-blue-600">{p.quantityChecked}</td>
                    <td className={`px-6 py-4 text-center font-black ${isSobra ? 'text-blue-600' : 'text-red-600'}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${isSobra ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {isSobra ? 'SOBRA' : 'FALTA'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <CheckCircle2 size={16} className="text-slate-400" />
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Justificativa da Liberação</label>
          </div>
          <textarea
            autoFocus
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[140px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium text-slate-700"
            placeholder="Descreva detalhadamente o motivo da aprovação deste lote com divergência..."
          ></textarea>

          {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

          <div className="flex gap-4 pt-4">
            <button
              onClick={onReject}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
            >
              <XCircle size={22} />
              Voltar para Ajustes
            </button>
            <button
              onClick={submitApproval}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={22} />
              Autorizar Conclusão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorCheck;
