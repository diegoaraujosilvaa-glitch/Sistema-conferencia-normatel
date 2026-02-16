
import React, { useState } from 'react';
import { Branch } from '../types';
import { Building2, Plus, Trash2, Search, X, Save, AlertCircle } from 'lucide-react';

interface BranchPanelProps {
  branches: Branch[];
  onAddBranch: (branch: Branch) => void;
  onDeleteBranch: (id: string) => void;
}

const BranchPanel: React.FC<BranchPanelProps> = ({ branches, onAddBranch, onDeleteBranch }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBranch, setNewBranch] = useState({ cnpj: '', name: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranch.cnpj.length < 14) {
      alert("CNPJ deve conter 14 dígitos.");
      return;
    }
    onAddBranch({
      id: Math.random().toString(36).substr(2, 9),
      ...newBranch
    });
    setNewBranch({ cnpj: '', name: '' });
    setShowAdd(false);
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.cnpj.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cadastro de Filiais</h3>
          <p className="text-slate-500 text-sm font-medium">Gerencie as filiais de destino para identificação automática.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          Cadastrar Nova Filial
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar por nome ou CNPJ..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Nome da Filial</th>
              <th className="px-6 py-4">CNPJ</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredBranches.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Building2 size={20} />
                    </div>
                    <span className="font-bold text-slate-800">{b.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs bg-slate-50 px-2 py-1 rounded font-mono text-slate-600">{b.cnpj}</code>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { if(window.confirm(`Excluir a filial ${b.name}?`)) onDeleteBranch(b.id) }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Filial</h4>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome da Filial</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium"
                    placeholder="Ex: Filial AS"
                    value={newBranch.name}
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">CNPJ (Apenas números)</label>
                  <input 
                    required
                    maxLength={14}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
                    placeholder="00000000000000"
                    value={newBranch.cnpj}
                    onChange={e => setNewBranch({...newBranch, cnpj: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Salvar Filial</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchPanel;
