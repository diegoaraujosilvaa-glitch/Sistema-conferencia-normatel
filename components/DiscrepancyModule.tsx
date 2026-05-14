
import React, { useState } from 'react';
import { AlertTriangle, ClipboardList, User as UserIcon, Calendar, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { ConferenceBatch, User } from '../types';
import SupervisorCheck from './SupervisorCheck';

interface DiscrepancyModuleProps {
  batches: ConferenceBatch[];
  users: User[];
  onApprove: (batch: ConferenceBatch, supervisor: User, justification: string) => void;
  onReject: (batch: ConferenceBatch) => void;
}

const DiscrepancyModule: React.FC<DiscrepancyModuleProps> = ({ batches, users, onApprove, onReject }) => {
  const [selectedBatch, setSelectedBatch] = useState<ConferenceBatch | null>(null);
  const pendingBatches = batches.filter(b => b.status === 'PENDING_SUPERVISOR');

  if (selectedBatch) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedBatch(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest transition-all mb-4"
        >
          <ArrowRight className="rotate-180" size={14} /> Voltar para Lista
        </button>
        <SupervisorCheck 
          batch={selectedBatch} 
          users={users} 
          onApprove={(supervisor, justification) => {
            onApprove(selectedBatch, supervisor, justification);
            setSelectedBatch(null);
          }} 
          onReject={() => {
            onReject(selectedBatch);
            setSelectedBatch(null);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Módulo de Divergências</h2>
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-1">Validação e autorização de conferências com diferenças</p>
        </div>
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-200 flex items-center gap-2">
          <AlertTriangle size={14} /> {pendingBatches.length} Pendentes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingBatches.map((batch) => (
          <div 
            key={batch.id} 
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-red-200 transition-all group overflow-hidden flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-red-50 p-3 rounded-xl text-red-500 shadow-inner group-hover:scale-110 transition-transform">
                  <AlertTriangle size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                  #{batch.id.split('-').pop()}
                </span>
              </div>

              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-4 line-clamp-1">
                {batch.notes.map(n => n.number).join(' / ')}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-800">
                  <UserIcon size={14} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">
                    Conferente: {batch.conferenteName}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-slate-800">
                  <Calendar size={14} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Finalizado em: {new Date(batch.endTime || '').toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertTriangle size={14} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {batch.products.filter(p => p.quantityExpected !== p.quantityChecked).length} Divergências Encontradas
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedBatch(batch)}
              className="w-full bg-slate-900 hover:bg-red-600 text-white py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:bg-red-600"
            >
              Analisar Divergências <ArrowRight size={14} />
            </button>
          </div>
        ))}

        {pendingBatches.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-6">
            <div className="bg-green-50 p-8 rounded-full mb-6 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tudo em conformidade</h3>
            <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs leading-relaxed">
              Não existem conferências pendentes de validação de supervisor no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscrepancyModule;
