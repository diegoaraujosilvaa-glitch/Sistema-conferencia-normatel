
import React, { useState, useMemo } from 'react';
import { ConferenceBatch } from '../types';
import { 
  Play, 
  Trash2, 
  Clock, 
  Package, 
  FileText, 
  Search, 
  FilterX, 
  AlertTriangle,
  X
} from 'lucide-react';

interface PausedBatchesProps {
  pausedBatches: ConferenceBatch[];
  onResume: (batch: ConferenceBatch) => void;
  onDelete: (id: string) => void;
}

const PausedBatches: React.FC<PausedBatchesProps> = ({ pausedBatches, onResume, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const filteredPaused = useMemo(() => {
    if (!searchTerm.trim()) return pausedBatches;
    
    const term = searchTerm.trim().toLowerCase();
    return pausedBatches.filter(batch => {
      const matchesNF = batch.notes.some(note => note.number.toLowerCase().includes(term));
      const matchesBatchId = batch.id.toLowerCase().includes(term);
      return matchesNF || matchesBatchId;
    });
  }, [pausedBatches, searchTerm]);

  const confirmDelete = () => {
    if (batchToDelete) {
      onDelete(batchToDelete);
      setBatchToDelete(null);
    }
  };

  if (pausedBatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
        <Clock size={64} className="text-slate-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Fila de Espera Vazia</h3>
        <p className="text-slate-300 text-sm">Nenhuma conferência pausada no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Barra de Pesquisa */}
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Pesquisar por número da Nota Fiscal (NF) ou ID do lote..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-14 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all font-medium text-slate-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <FilterX size={20} />
          </button>
        )}
      </div>

      {filteredPaused.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPaused.map((batch) => {
            const totalChecked = batch.products.reduce((acc, p) => acc + p.quantityChecked, 0);
            const totalExpected = batch.products.reduce((acc, p) => acc + p.quantityExpected, 0);
            const progress = Math.min(Math.round((totalChecked / totalExpected) * 100), 100);

            return (
              <div key={batch.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group border-l-4 border-l-orange-400">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-3 rounded-2xl">
                      <Clock className="text-orange-500" size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight">Lote #{batch.id}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pausado em {new Date(batch.startTime).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBatchToDelete(batch.id)}
                    className="text-slate-300 hover:text-red-600 p-2.5 bg-slate-50 hover:bg-red-50 rounded-xl transition-all"
                    title="Excluir Lote"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">
                      <FileText size={12} /> Notas Fiscais (NF)
                    </div>
                    <p className="text-xs font-black text-blue-700 truncate">
                      {batch.notes.map(n => n.number).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                      <Package size={12} /> SKUs
                    </div>
                    <p className="text-xs font-bold text-slate-700">{batch.products.length} Itens</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                      <Clock size={12} /> Responsável
                    </div>
                    <p className="text-xs font-bold text-slate-700 truncate">{batch.conferenteName}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Progresso Salvo</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-400 h-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <button 
                  onClick={() => onResume(batch)}
                  className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/10 group-hover:scale-[1.01]"
                >
                  Retomar Conferência
                  <Play size={14} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
          <Search size={48} className="text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Nenhuma NF encontrada</h3>
          <p className="text-slate-300 text-sm">Não encontramos conferências pausadas com o termo "{searchTerm}".</p>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {batchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-100">
            <div className="p-8 text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">Excluir Lote Pausado?</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Esta ação removerá permanentemente este lote da fila de espera. Deseja continuar?
              </p>
              
              <div className="mt-10 flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  SIM
                </button>
                <button 
                  onClick={() => setBatchToDelete(null)}
                  className="w-full bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                >
                  NÃO
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
               <button 
                onClick={() => setBatchToDelete(null)}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
              >
                <X size={14} /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PausedBatches;
