
import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Search, 
  CheckCircle, 
  ArrowRight,
  AlertCircle,
  Package,
  Save,
  Trash2,
  X,
  AlertTriangle,
  History,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { ConferenceBatch, NFeProduct } from '../types';

interface BlindCheckProps {
  batch: ConferenceBatch;
  onUpdateBatch: (batch: ConferenceBatch) => void;
  onFinish: () => void;
  onCancel: () => void;
  onPause: () => void;
}

const BlindCheck: React.FC<BlindCheckProps> = ({ batch, onUpdateBatch, onFinish, onCancel, onPause }) => {
  const [searchInput, setSearchInput] = useState('');
  const [manualQty, setManualQty] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScanned, setLastScanned] = useState<NFeProduct | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDivergenceConfirm, setShowDivergenceConfirm] = useState(false);
  const [scanHistory, setScanHistory] = useState<NFeProduct[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const totalExpected = batch.products.reduce((acc, p) => acc + p.quantityExpected, 0);
  const totalChecked = batch.products.reduce((acc, p) => acc + p.quantityChecked, 0);
  const progress = Math.min(Math.round((totalChecked / totalExpected) * 100), 100);

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 3 
    });
  };

  // Função para gerar sinal sonoro de erro
  const playErrorSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'square'; // Som mais agressivo para erro
      oscillator.frequency.setValueAtTime(110, audioCtx.currentTime); // Frequência baixa
      oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Navegador bloqueou áudio ou erro na API Web Audio", e);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const term = searchInput.trim().toUpperCase();
    const productIndex = batch.products.findIndex(p => 
      p.ean === term || p.code.toUpperCase() === term
    );

    if (productIndex === -1) {
      setErrorMsg(`ITEM "${term}" NÃO ENCONTRADO NO LOTE`);
      playErrorSound(); // Dispara o som de erro
      setTimeout(() => setErrorMsg(''), 3000);
    } else {
      const updatedProducts = [...batch.products];
      updatedProducts[productIndex].quantityChecked = parseFloat((updatedProducts[productIndex].quantityChecked + manualQty).toFixed(3));
      
      onUpdateBatch({ ...batch, products: updatedProducts });
      setLastScanned(updatedProducts[productIndex]);
      setScanHistory(prev => [updatedProducts[productIndex], ...prev].slice(0, 5));
      setSearchInput('');
      setManualQty(1);
    }
    inputRef.current?.focus();
  };

  const removeItem = (id: string) => {
    const updatedProducts = batch.products.map(p => 
      p.id === id ? { ...p, quantityChecked: 0 } : p
    );
    onUpdateBatch({ ...batch, products: updatedProducts });
  };

  const handleFinishAttempt = () => {
    const hasDivergence = batch.products.some(p => p.quantityExpected !== p.quantityChecked);
    if (hasDivergence) {
      playErrorSound();
      setShowDivergenceConfirm(true);
    } else {
      onFinish();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full gap-4 lg:gap-8 pb-20 animate-in fade-in duration-500">
      
      {/* Workspace de Operação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 flex-1 min-h-0">
        
        {/* Painel de Comando (Esquerda) */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-8">
          <div className="bg-slate-900 text-white p-6 lg:p-10 rounded-xl shadow-2xl relative overflow-hidden group border border-slate-800">
            <div className="absolute top-0 right-0 p-10 opacity-5 hidden lg:block">
              <Zap size={150} />
            </div>
            
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-[#E66B27] mb-6 lg:mb-8 flex items-center gap-3">
              <Scan size={16} /> Terminal Operacional
            </h4>
            
            <form onSubmit={handleScan} className="space-y-6 lg:space-y-8 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">EAN ou Código Interno</label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-md py-4 lg:py-6 pl-12 lg:pl-16 pr-4 lg:pr-6 font-mono text-xl lg:text-2xl focus:outline-none focus:border-[#E66B27] focus:ring-8 focus:ring-orange-500/10 transition-all text-white placeholder-slate-600"
                    placeholder="Bipar item..."
                    autoComplete="off"
                    inputMode="text"
                  />
                  <Search className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} lg:size={28} />
                </div>
              </div>

              <div className="flex gap-3 lg:gap-4">
                <div className="w-1/3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Qtd</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={manualQty}
                      onChange={(e) => setManualQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-md py-4 lg:py-5 px-4 lg:px-6 font-black text-xl lg:text-2xl text-center focus:outline-none focus:border-[#E66B27] text-white"
                    />
                    {lastScanned && (
                      <span className="absolute -top-2 -right-2 bg-[#E66B27] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">
                        {lastScanned.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex items-end">
                  <button 
                    type="submit"
                    className="w-full bg-[#E66B27] hover:bg-[#d55a1a] text-white py-4 lg:py-5 rounded-md font-black uppercase tracking-[0.2em] text-[10px] lg:text-[11px] transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center gap-2 lg:gap-3 transform active:scale-95"
                  >
                    Confirmar <ArrowRight size={18} lg:size={20} />
                  </button>
                </div>
              </div>
            </form>

            {errorMsg && (
              <div className="mt-6 lg:mt-8 p-4 lg:p-5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md flex items-center gap-3 lg:gap-4 animate-bounce">
                <AlertTriangle size={20} lg:size={24} className="shrink-0" />
                <span className="font-black text-[9px] lg:text-[10px] uppercase tracking-widest">{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Status Real-time do Lote */}
          <div className="bg-white p-6 lg:p-10 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E66B27] group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-end mb-4 lg:mb-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acuracidade Lote</p>
                <h3 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tighter mt-1">{progress}%</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo Físico</p>
                <p className="text-xs lg:text-sm font-black text-[#E66B27] mt-1">{formatNumber(totalChecked)} / {formatNumber(totalExpected)}</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-4 lg:h-5 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${progress >= 100 ? 'bg-green-500' : 'bg-[#E66B27]'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Histórico Local - Escondido em telas muito pequenas para economizar espaço se necessário, ou reduzido */}
          <div className="bg-white p-6 lg:p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col hidden sm:flex">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 lg:mb-6 flex items-center gap-3">
              <History size={16} className="text-[#E66B27]" /> Últimas Leituras
            </h4>
            <div className="space-y-3 lg:space-y-4 overflow-y-auto max-h-[200px] lg:max-h-[300px] pr-2 report-scrollbar">
              {scanHistory.map((item, idx) => (
                <div key={idx} className={`p-4 lg:p-5 rounded-md bg-slate-50 border border-slate-100 shadow-sm flex justify-between items-center animate-in slide-in-from-left-4 duration-500 opacity-${100 - (idx * 20)}`}>
                  <div className="max-w-[70%] lg:max-w-[75%]">
                    <p className="text-[9px] lg:text-[10px] font-black text-slate-800 uppercase truncate leading-none">{item.description}</p>
                    <p className="text-[8px] lg:text-[9px] text-slate-400 font-bold uppercase mt-1 lg:mt-1.5 tracking-widest">{item.ean}</p>
                  </div>
                  <div className="bg-orange-50 px-2 lg:px-3 py-1 lg:py-1.5 rounded-xl text-[8px] lg:text-[9px] font-black text-[#E66B27] border border-orange-100">
                    BIP
                  </div>
                </div>
              ))}
              {scanHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 lg:py-16 opacity-10 grayscale">
                  <Scan size={48} lg:size={64} className="mb-4" />
                  <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-center">Aguardando conferência...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Conferência (Direita) */}
        <div className="lg:col-span-8 bg-white rounded-xl lg:rounded-none shadow-sm border border-slate-100 flex flex-col min-h-[400px] lg:min-h-0 overflow-hidden">
          <div className="px-4 lg:px-6 py-4 lg:py-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="bg-slate-900 p-2 lg:p-2.5 rounded-xl text-[#E66B27] shadow-lg">
                <Package size={18} lg:size={20} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm lg:text-base">Itens no Manifesto</h4>
                <p className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-0.5 lg:mt-1">Status de conferência física (SKU)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 w-full sm:w-auto">
               <button 
                onClick={onPause}
                className="flex-1 sm:flex-none bg-white border-2 border-slate-100 hover:border-[#E66B27] hover:text-[#E66B27] text-slate-500 px-3 lg:px-4 py-2 lg:py-2.5 rounded-md font-black text-[8px] lg:text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={12} lg:size={14} /> Pausar
              </button>
              <button 
                onClick={() => setShowDiscardConfirm(true)}
                className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-500 px-3 lg:px-4 py-2 lg:py-2.5 rounded-md font-black text-[8px] lg:text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={12} lg:size={14} /> Descartar
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto report-scrollbar">
            {/* Desktop View (Table) */}
            <div className="hidden lg:block">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-xl z-10 border-b border-slate-100">
                  <tr className="text-slate-900 text-[10px] uppercase font-black tracking-[0.2em]">
                    <th className="px-6 py-5">Informação SKU</th>
                    <th className="px-4 py-5 text-center">Qtd</th>
                    <th className="px-6 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {batch.products
                    .filter(p => p.quantityChecked > 0)
                    .sort((a, b) => b.quantityChecked - a.quantityChecked)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-xs lg:text-sm uppercase tracking-tight line-clamp-1">{p.description}</p>
                          <p className="text-[10px] text-slate-800 font-mono mt-1.5 uppercase flex items-center gap-2">
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black">COD: {p.code}</span>
                             <span className="opacity-20">|</span>
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black">EAN: {p.ean}</span>
                          </p>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-block px-4 py-2 bg-orange-50 text-[#E66B27] rounded-md font-black text-sm min-w-[5rem] border border-orange-100/50 shadow-inner">
                              {formatNumber(p.quantityChecked)}
                            </span>
                            <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{p.unit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => removeItem(p.id)}
                            className="p-2.5 bg-white hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-md transition-all inline-flex items-center justify-center border border-slate-100 hover:border-red-100 shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (List) */}
            <div className="lg:hidden divide-y divide-slate-50">
              {batch.products
                .filter(p => p.quantityChecked > 0)
                .sort((a, b) => b.quantityChecked - a.quantityChecked)
                .map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight truncate">{p.description}</p>
                      <p className="text-[10px] text-slate-800 font-mono mt-1.5 uppercase flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-[9px] font-black">COD: {p.code}</span>
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-[9px] font-black">EAN: {p.ean}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Conferido</span>
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-block px-3 py-2 bg-orange-50 text-[#E66B27] rounded-md font-black text-sm border border-orange-100/50 shadow-inner min-w-[4rem] text-center">
                            {formatNumber(p.quantityChecked)}
                          </span>
                          <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">{p.unit}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(p.id)}
                        className="p-2.5 bg-white text-slate-300 hover:text-red-500 rounded-md border border-slate-100 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Empty State */}
            {batch.products.every(p => p.quantityChecked === 0) && (
              <div className="px-4 lg:px-6 py-16 lg:py-24 text-center">
                <div className="flex flex-col items-center gap-3 lg:gap-4 grayscale opacity-10">
                  <Scan className="w-14 h-14 lg:w-20 lg:h-20 animate-pulse" />
                  <div>
                    <h5 className="font-black text-base lg:text-xl uppercase tracking-[0.3em]">Aguardando Bipagem</h5>
                    <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 lg:mt-2">Nenhum item processado neste manifesto</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-4 lg:px-6 py-4 lg:py-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3 lg:gap-4">
               <div className="flex flex-col">
                <p className="text-slate-500 text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em]">SKUs Lidos</p>
                <p className="text-white font-black text-lg lg:text-xl tracking-tighter">{batch.products.filter(p => p.quantityChecked > 0).length}</p>
               </div>
            </div>
            <button 
              onClick={handleFinishAttempt}
              className="bg-[#E66B27] hover:bg-[#d55a1a] text-white px-4 lg:px-8 py-3 lg:py-4 rounded-md font-black uppercase tracking-[0.2em] text-[9px] lg:text-[10px] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2 lg:gap-3 transform hover:scale-105 active:scale-95"
            >
              Finalizar <span className="hidden sm:inline">Manifesto</span> <CheckCircle size={16} lg:size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Descarte */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-12 animate-in zoom-in duration-300 text-center border border-white/10">
            <div className="bg-red-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 text-red-500 shadow-inner">
              <AlertTriangle size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-tight">Abortar Conferência?</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed mb-12">
              Todo o progresso físico deste manifesto será descartado. Deseja realmente confirmar?
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={onCancel}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-6 rounded-md font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-red-500/20"
              >
                Sim, descartar tudo
              </button>
              <button 
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-6 rounded-md font-black uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                Não, manter conferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Divergência */}
      {showDivergenceConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-12 animate-in zoom-in duration-300 text-center border border-white/10">
            <div className="bg-orange-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 text-orange-500 shadow-inner animate-pulse">
              <AlertCircle size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-tight">Divergência Detectada!</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed mb-12">
              Existem diferenças entre o XML e o físico. O que deseja fazer?
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowDivergenceConfirm(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-6 rounded-md font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3"
              >
                <History size={18} /> Voltar e Reconferir
              </button>
              <button 
                onClick={() => {
                  setShowDivergenceConfirm(false);
                  onFinish();
                }}
                className="w-full bg-[#E66B27] hover:bg-[#d55a1a] text-white py-6 rounded-md font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
              >
                <ShieldCheck size={18} /> Enviar para Supervisor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlindCheck;
