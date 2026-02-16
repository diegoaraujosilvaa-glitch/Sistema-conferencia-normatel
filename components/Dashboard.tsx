
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { ConferenceBatch, UserRole } from '../types';
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
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  batches: ConferenceBatch[];
}

const Dashboard: React.FC<DashboardProps> = ({ batches }) => {
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const bDate = (b.endTime || b.startTime).split('T')[0];
      return bDate >= startDate && bDate <= endDate;
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
      { label: 'Acuracidade Geral', value: `${accuracyRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Lotes Divergentes', value: totalDivergences, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    ];
  }, [filteredBatches]);

  const ranking = useMemo(() => {
    const map: Record<string, { count: number, accuracy: number }> = {};
    filteredBatches.forEach(b => {
      if (!map[b.conferenteName]) map[b.conferenteName] = { count: 0, accuracy: 0 };
      map[b.conferenteName].count += 1;
      const hasDiv = b.products.some(p => parseFloat(p.quantityExpected.toFixed(3)) !== parseFloat(p.quantityChecked.toFixed(3)));
      if (!hasDiv) map[b.conferenteName].accuracy += 1;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        rate: (data.accuracy / data.count) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredBatches]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Filtros Estratégicos */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-end gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
              <Calendar size={14} className="text-[#E66B27]" /> Período Inicial
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-700 focus:ring-2 focus:ring-[#E66B27] outline-none transition-all uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
              <Calendar size={14} className="text-[#E66B27]" /> Período Final
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-700 focus:ring-2 focus:ring-[#E66B27] outline-none transition-all uppercase"
            />
          </div>
        </div>
        <button 
          onClick={() => {
            setStartDate("");
            setEndDate(new Date().toISOString().split('T')[0]);
          }}
          className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-4 rounded-2xl transition-all border border-slate-200 hover:text-[#E66B27]"
          title="Limpar Filtros"
        >
          <FilterX size={20} />
        </button>
      </div>

      {/* KPIs de Gestão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-[#E66B27] group">
            <div className="flex items-center justify-between mb-6">
              <div className={`${stat.bg} p-4 rounded-[22px] group-hover:scale-110 transition-transform`}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <TrendingUp size={16} className="text-slate-200" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-4xl font-black text-slate-800 mt-2 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Tendência */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#E66B27]"></div>
                Volume de Conferência
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Produtividade operacional por colaborador</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking.map(r => ({ name: r.name.split(' ')[0], qty: r.count }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                   cursor={{fill: '#fff7ed', radius: 12}} 
                   contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} 
                   itemStyle={{ color: '#E66B27', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="qty" fill="#E66B27" radius={[12, 12, 12, 12]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Conferentes */}
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-orange-50 p-4 rounded-3xl">
              <Trophy className="text-[#E66B27]" size={28} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">Performance</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Líderes de Expedição</p>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            {ranking.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[28px] border border-slate-100 transition-all hover:scale-[1.03] hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-xs font-black transition-all ${
                    idx === 0 ? 'bg-orange-100 border-[#E66B27] text-[#E66B27]' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle2 size={10} className="text-green-500" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{item.rate.toFixed(0)}% ACURACIDADE</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-800 group-hover:text-[#E66B27] transition-colors">{item.count}</p>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Manifestos</p>
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
