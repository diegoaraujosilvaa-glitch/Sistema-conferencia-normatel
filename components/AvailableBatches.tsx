
import React, { useState } from 'react';
import { ClipboardList, Play, Building2, Calendar, Package, MapPin, Trash2, AlertTriangle, X } from 'lucide-react';
import { ConferenceBatch } from '../types';

interface AvailableBatchesProps {
  batches: ConferenceBatch[];
  onSelect: (batch: ConferenceBatch) => void;
  onDelete?: (id: string) => void;
  userRole?: string;
}

const AvailableBatches: React.FC<AvailableBatchesProps> = ({ batches, onSelect, onDelete, userRole }) => {
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const availableBatches = batches.filter(b => b.status === 'READY');
  const canDelete = userRole === 'ADMIN' || userRole === 'SUPERVISOR';

  const confirmDelete = () => {
    if (batchToDelete && onDelete) {
      onDelete(batchToDelete);
      setBatchToDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lotes Disponíveis</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Selecione um manifesto para iniciar a conferência</p>
        </div>
        <div className="bg-orange-100 text-[#E66B27] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200">
          {availableBatches.length} Lotes Aguardando
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableBatches.map((batch) => (
          <div 
            key={batch.id} 
            className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#E66B27]/30 transition-all group overflow-hidden flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-900 p-2.5 rounded-lg text-[#E66B27] shadow-lg group-hover:scale-110 transition-transform">
                  <ClipboardList size={20} />
                </div>
                <div className="flex items-center gap-2">
                  {canDelete && onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setBatchToDelete(batch.id);
                      }}
                      className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-all"
                      title="Excluir Lote"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                    #{batch.id.split('-').pop()}
                  </span>
                </div>
              </div>

              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-4 line-clamp-1">
                {batch.notes.map(n => n.number).join(' / ')}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#E66B27]">
                  <MapPin size={14} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">
                    Filial: {batch.branchName || 'Não definida'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Building2 size={14} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest truncate">
                    Fornecedor: {batch.notes[0]?.vendorName || 'Fornecedor não identificado'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Package size={14} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    {batch.products.length} SKUs • {batch.products.reduce((acc, p) => acc + p.quantityExpected, 0)} Itens
                  </p>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Calendar size={14} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Criado em: {new Date(batch.startTime).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onSelect(batch)}
              className="w-full bg-slate-50 hover:bg-[#E66B27] text-slate-600 hover:text-white py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all border-t border-slate-100 flex items-center justify-center gap-2 group-hover:bg-[#E66B27] group-hover:text-white"
            >
              Iniciar Conferência <Play size={14} fill="currentColor" />
            </button>
          </div>
        ))}

        {availableBatches.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-6">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
              <ClipboardList size={40} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nenhum lote disponível</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs">
              Aguarde a importação de novos manifestos pelo supervisor para iniciar o trabalho.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {batchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-100">
            <div className="p-8 text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">Excluir Lote?</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Esta ação removerá permanentemente este lote da lista de disponíveis. Deseja continuar?
              </p>
              
              <div className="mt-10 flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  SIM, EXCLUIR
                </button>
                <button 
                  onClick={() => setBatchToDelete(null)}
                  className="w-full bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                >
                  NÃO, CANCELAR
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

export default AvailableBatches;
