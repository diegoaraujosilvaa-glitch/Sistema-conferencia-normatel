
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LabelList
} from 'recharts';
import { ConferenceBatch, UserRole, DashboardStats } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Package, 
  ClipboardCheck, 
  TrendingUp,
  FilterX,
  Users,
  Trophy,
  History as HistoryIcon,
  ArrowRight,
  Search,
  Loader2,
  Database
} from 'lucide-react';
import { buscarLotesPorPeriodo } from '../src/services/conferenceService';

/**
 * Extrai a data ISO 'YYYY-MM-DD' de um lote de forma segura, suportando strings ISO, timestamps e Date objects.
 */
export const getBatchDate = (b: ConferenceBatch): string => {
  const dateVal = b.endTime || b.startTime || (b as any).createdAt;
  if (dateVal) {
    if (typeof dateVal === 'string') {
      return dateVal.split('T')[0];
    }
    if (typeof (dateVal as any).toDate === 'function') {
      return (dateVal as any).toDate().toISOString().split('T')[0];
    }
    if ((dateVal as any).seconds) {
      return new Date((dateVal as any).seconds * 1000).toISOString().split('T')[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
  }
  if (b.notes && b.notes.length > 0 && b.notes[0].emissionDate) {
    return b.notes[0].emissionDate.split('T')[0];
  }
  return '';
};

interface DashboardProps {
  batches: ConferenceBatch[];
  firestoreStats?: DashboardStats | null;
  onHistoricalBatchesLoaded?: (newBatches: ConferenceBatch[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ batches, firestoreStats, onHistoricalBatchesLoaded }) => {
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // Armazena períodos já consultados nesta sessão para economizar leituras no Firestore
  const queriedPeriodsRef = useRef<Set<string>>(new Set());

  // Busca lotes históricos do Firestore sob demanda com getDocs (sem listener contínuo)
  const handleFetchPeriodData = async (start: string, end: string, isManual = false) => {
    if (!start || !end) return;
    const periodKey = `${start}_${end}`;

    if (!isManual && queriedPeriodsRef.current.has(periodKey)) {
      return;
    }

    try {
      setIsLoadingPeriod(true);
      setSearchFeedback({ message: 'Consultando histórico do banco de dados...', type: 'info' });

      const results = await buscarLotesPorPeriodo(start, end);
      queriedPeriodsRef.current.add(periodKey);

      if (results.length > 0) {
        if (onHistoricalBatchesLoaded) {
          onHistoricalBatchesLoaded(results);
        }
        setSearchFeedback({ 
          message: `${results.length} manifesto(s) carregado(s) com sucesso para o período.`, 
          type: 'success' 
        });
      } else {
        setSearchFeedback({ 
          message: `Nenhum manifesto encontrado no banco de dados para o período informado.`, 
          type: 'warning' 
        });
      }
    } catch (error) {
      console.error("Erro ao buscar histórico do período:", error);
      setSearchFeedback({ message: 'Erro ao consultar banco de dados.', type: 'warning' });
    } finally {
      setIsLoadingPeriod(false);
    }
  };

  // Auto-busca quando o usuário seleciona um período que não tem lotes em memória (ex: meses anteriores)
  useEffect(() => {
    if (!startDate || !endDate) return;

    // Data mais antiga entre os lotes já carregados em memória
    let oldestInMemory = '';
    batches.forEach(b => {
      const d = getBatchDate(b);
      if (d && (!oldestInMemory || d < oldestInMemory)) {
        oldestInMemory = d;
      }
    });

    const periodKey = `${startDate}_${endDate}`;
    const hasBatchesInPeriod = batches.some(b => {
      if (b.status === 'READY') return false;
      const bDate = getBatchDate(b);
      return bDate >= startDate && bDate <= endDate;
    });

    // Se não há lotes neste período em memória OU a data inicial é mais antiga que os dados carregados
    const needsFetch = !hasBatchesInPeriod || (oldestInMemory && startDate < oldestInMemory);

    if (needsFetch && !queriedPeriodsRef.current.has(periodKey)) {
      const timer = setTimeout(() => {
        handleFetchPeriodData(startDate, endDate, false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (b.status === 'READY') return false;
      const bDate = getBatchDate(b);
      if (!bDate) return false;
      if (startDate && bDate < startDate) return false;
      if (endDate && bDate > endDate) return false;
      return true;
    });
  }, [batches, startDate, endDate]);

  const stats = useMemo(() => {
    const totalConferences = filteredBatches.length;
    const totalDivergences = filteredBatches.filter(b => 
      b.products.some(p => parseFloat(p.quantityExpected.toFixed(3)) !== parseFloat(p.quantityChecked.toFixed(3)))
    ).length;
    
    const totalItems = filteredBatches.reduce((acc, b) => acc + b.products.length, 0);
    const accuracyRate = totalConferences > 0 ? ((totalConferences - totalDivergences) / totalConferences) * 100 : 100;

    return [
      { label: 'Manifestos Concluídos', value: totalConferences, icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'SKUs Conferidos', value: totalItems, icon: Package, color: 'text-slate-600', bg: 'bg-slate-100' },
      { label: 'Acuracidade', value: `${accuracyRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Lotes Divergentes', value: totalDivergences, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    ];
  }, [filteredBatches]);

  const ranking = useMemo(() => {
    const map: Record<string, { count: number, accuracy: number, skus: number }> = {};
    filteredBatches.forEach(b => {
      if (!map[b.conferenteName]) map[b.conferenteName] = { count: 0, accuracy: 0, skus: 0 };
      map[b.conferenteName].count += 1;
      map[b.conferenteName].skus += b.products.length;
      const hasDiv = b.products.some(p => parseFloat(p.quantityExpected.toFixed(3)) !== parseFloat(p.quantityChecked.toFixed(3)));
      if (!hasDiv) map[b.conferenteName].accuracy += 1;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        skus: data.skus,
        rate: (data.accuracy / data.count) * 100
      }))
      .sort((a, b) => b.skus - a.skus || b.count - a.count);
  }, [filteredBatches]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Filtros Estratégicos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                <Calendar size={14} className="text-[#E66B27]" /> Período Inicial
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-5 py-3 text-xs font-black text-slate-700 focus:ring-2 focus:ring-[#E66B27] outline-none transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                <Calendar size={14} className="text-[#E66B27]" /> Período Final
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-5 py-3 text-xs font-black text-slate-700 focus:ring-2 focus:ring-[#E66B27] outline-none transition-all uppercase"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleFetchPeriodData(startDate, endDate, true)}
              disabled={isLoadingPeriod || !startDate || !endDate}
              className="flex-1 md:flex-none bg-[#E66B27] hover:bg-[#d55a1a] disabled:opacity-50 text-white px-6 py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              title="Consultar dados deste período no banco"
            >
              {isLoadingPeriod ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Consultar Período</span>
                </>
              )}
            </button>
            <button 
              onClick={() => {
                setStartDate("");
                setEndDate(new Date().toISOString().split('T')[0]);
                setSearchFeedback(null);
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-3.5 rounded-md transition-all border border-slate-200 hover:text-[#E66B27]"
              title="Limpar Filtros"
            >
              <FilterX size={20} />
            </button>
          </div>
        </div>

        {/* Feedback visual de consulta */}
        {searchFeedback && (
          <div className={`text-xs font-bold px-4 py-2.5 rounded-md flex items-center justify-between transition-all ${
            searchFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            searchFeedback.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
            'bg-orange-50 text-orange-800 border border-orange-200'
          }`}>
            <span className="flex items-center gap-2">
              {isLoadingPeriod ? <Loader2 size={14} className="animate-spin text-[#E66B27]" /> : <Database size={14} className="text-[#E66B27]" />}
              {searchFeedback.message}
            </span>
            <button onClick={() => setSearchFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs font-black ml-4">✕</button>
          </div>
        )}
      </div>

      {/* KPIs de Gestão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-[#E66B27] group">
            <div className="flex items-center justify-between mb-6">
              <div className={`${stat.bg} p-4 rounded-md group-hover:scale-110 transition-transform`}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <TrendingUp size={16} className="text-slate-200" />
            </div>
            <p className="text-slate-800 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Tendência */}
        <div className="lg:col-span-2 bg-white p-8 lg:p-10 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#E66B27]"></div>
                  Volume de Conferência
                </h3>
                <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest mt-1">Produtividade operacional por conferente (SKUs e Manifestos)</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-slate-700"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block"></span> SKUs</span>
                <span className="flex items-center gap-1.5 text-[#E66B27]"><span className="w-2.5 h-2.5 rounded bg-[#E66B27] inline-block"></span> Manifestos</span>
              </div>
            </div>
            
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart 
                  data={ranking.map(r => ({ name: r.name.split(' ')[0], manifestos: r.count, skus: r.skus }))}
                  margin={{ top: 25, right: 10, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} dy={10} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.25))]} />
                  <Tooltip 
                     cursor={{fill: '#fff7ed', radius: 12}} 
                     contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} 
                     itemStyle={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="skus" name="SKUs" fill="#94a3b8" radius={[8, 8, 0, 0]} barSize={22}>
                    <LabelList 
                      dataKey="skus" 
                      position="top" 
                      fill="#475569" 
                      fontSize={10} 
                      fontWeight={900} 
                      offset={6}
                    />
                  </Bar>
                  <Bar dataKey="manifestos" name="Manifestos" fill="#E66B27" radius={[8, 8, 0, 0]} barSize={22}>
                    <LabelList 
                      dataKey="manifestos" 
                      position="top" 
                      fill="#E66B27" 
                      fontSize={10} 
                      fontWeight={900} 
                      offset={6} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ranking de Conferentes */}
        <div className="bg-white p-8 lg:p-10 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-3 rounded-md">
                <Trophy className="text-[#E66B27]" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase">Performance</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Rank por Quantidade de SKUs</p>
              </div>
            </div>
            {ranking.length > 0 && (
              <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">
                {ranking.length} {ranking.length === 1 ? 'Conferente' : 'Conferentes'}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[480px] pr-2 report-scrollbar">
            {ranking.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                idx === 0 
                  ? 'bg-orange-50/60 border-orange-200 shadow-sm' 
                  : idx === 1 
                  ? 'bg-slate-50/80 border-slate-200' 
                  : idx === 2 
                  ? 'bg-amber-50/40 border-amber-200' 
                  : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 shrink-0 rounded-md border-2 flex items-center justify-center text-xs font-black transition-all ${
                    idx === 0 
                      ? 'bg-[#E66B27] border-[#E66B27] text-white shadow-sm' 
                      : idx === 1 
                      ? 'bg-slate-200 border-slate-300 text-slate-800' 
                      : idx === 2 
                      ? 'bg-amber-100 border-amber-300 text-amber-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}º
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 size={11} className="text-green-600 shrink-0" />
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{item.rate.toFixed(0)}% Acurácia</p>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-0.5 shrink-0 pl-2">
                  <div className="flex items-baseline gap-1">
                    <p className="text-base font-black text-[#E66B27] leading-none">{item.skus.toLocaleString('pt-BR')}</p>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">SKUs</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xs font-black text-slate-700 leading-none">{item.count}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{item.count === 1 ? 'Manif.' : 'Manifs.'}</p>
                  </div>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-30 py-10">
                <Users size={64} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center leading-relaxed">Aguardando dados de<br/>performance operacional</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
