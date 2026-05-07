
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  User as UserIcon, 
  Package, 
  ArrowRight, 
  Search, 
  FilterX, 
  AlertCircle,
  Timer,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { ConferenceBatch } from '../types';

interface ActiveConferencesProps {
  activeBatches: ConferenceBatch[];
}

const ActiveConferences: React.FC<ActiveConferencesProps> = ({ activeBatches }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());

  // Atualiza o relógio a cada minuto para o tempo decorrido
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredActive = activeBatches.filter(batch => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      batch.conferenteName.toLowerCase().includes(term) ||
      batch.id.toLowerCase().includes(term) ||
      batch.notes.some(n => n.number.toLowerCase().includes(term))
    );
  });

  const getTimeElapsed = (startTime: string) => {
    const start = new Date(startTime);
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Conferências em Tempo Real</h2>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-1">Monitoramento de produtividade e fluxo físico</p>
        </div>
        <div className="bg-blue-100 text-blue-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200 flex items-center gap-2 shadow-sm">
          <Activity size={14} className="animate-pulse" /> {activeBatches.length} Ativas Agora
        </div>
      </div>

      {/* Filtro */}
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E66B27] transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Filtrar por Conferente, NF ou ID..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-14 focus:ring-4 focus:ring-orange-500/10 focus:border-[#E66B27] focus:outline-none shadow-sm transition-all font-medium text-slate-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
          >
            <FilterX size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredActive.map((batch) => {
          const totalChecked = batch.products.reduce((acc, p) => acc + p.quantityChecked, 0);
          const totalExpected = batch.products.reduce((acc, p) => acc + p.quantityExpected, 0);
          const progress = Math.min(Math.round((totalChecked / totalExpected) * 100), 100);

          return (
            <div key={batch.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                <div 
                  className="h-full bg-[#E66B27] transition-all duration-1000" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 p-3.5 rounded-2xl text-[#E66B27] shadow-lg">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{batch.conferenteName}</h4>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">ID: #{batch.id.split('-').pop()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <Timer size={12} className="animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{getTimeElapsed(batch.startTime)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 flex-1">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Package size={12} className="text-[#E66B27]" /> Notas Fiscais
                  </p>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {batch.notes.map(n => n.number).join(' / ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">SKUs</p>
                    <p className="text-sm font-black text-slate-900">{batch.products.length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Físico Lido</p>
                    <p className="text-sm font-black text-[#E66B27]">{totalChecked.toLocaleString('pt-BR')} un</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Acuracidade Atual</p>
                    <p className="text-xl font-black text-slate-900 tracking-tighter">{progress}%</p>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${progress >= 100 ? 'bg-green-500' : 'bg-[#E66B27]'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Em Processamento</span>
                </div>
                <div className="flex items-center gap-1 text-[#E66B27]">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Ativo</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredActive.length === 0 && (
          <div className="col-span-full py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-6">
            <div className="bg-slate-50 p-10 rounded-full mb-8 text-slate-200">
              <Activity size={80} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nenhuma Atividade</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-3 max-w-sm leading-relaxed">
              Não existem conferentes operando no sistema neste exato momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveConferences;
