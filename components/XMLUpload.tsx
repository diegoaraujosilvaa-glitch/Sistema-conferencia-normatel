
import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, Building2, AlertTriangle } from 'lucide-react';
import { parseNFeXML, consolidateProducts } from '../services/xmlParser';
import { NFeInfo, NFeProduct, ConferenceBatch, User, Branch } from '../types';

interface XMLUploadProps {
  currentUser: User;
  branches: Branch[];
  onStartConference: (batch: ConferenceBatch) => void;
}

const XMLUpload: React.FC<XMLUploadProps> = ({ currentUser, branches, onStartConference }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<{ info: NFeInfo; products: NFeProduct[] }[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const newFilesInput = Array.from(e.target.files) as File[];
    
    try {
      const results = await Promise.all(newFilesInput.map(file => parseNFeXML(file)));
      
      const duplicates: string[] = [];
      const uniqueResults: { info: NFeInfo; products: NFeProduct[] }[] = [];
      const uniqueFiles: File[] = [];

      // Chaves de acesso já existentes no estado atual
      const existingKeys = new Set(parsedData.map(d => d.info.accessKey));
      // Chaves processadas nesta leva (para evitar duplicidade no mesmo upload)
      const batchKeys = new Set<string>();

      results.forEach((res, index) => {
        const key = res.info.accessKey;
        if (existingKeys.has(key) || batchKeys.has(key)) {
          duplicates.push(res.info.number);
        } else {
          batchKeys.add(key);
          uniqueResults.push(res);
          uniqueFiles.push(newFilesInput[index]);
        }
      });

      if (duplicates.length > 0) {
        alert(`CRÍTICA DE IMPORTAÇÃO:\nAs Notas Fiscais [ ${duplicates.join(', ')} ] já foram importadas ou estão duplicadas na seleção e não serão adicionadas.`);
      }

      if (uniqueResults.length > 0) {
        setFiles(prev => [...prev, ...uniqueFiles]);
        setParsedData(prev => [...prev, ...uniqueResults]);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar um ou mais arquivos XML. Verifique a integridade dos arquivos.");
    } finally {
      setLoading(false);
      // Limpar o input para permitir selecionar os mesmos arquivos novamente se necessário após remoção
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  const getOriginName = (cnpj: string, vendorName: string) => {
    const found = branches.find(b => b.cnpj === cnpj);
    return found ? found.name : vendorName;
  };

  const initConference = () => {
    if (parsedData.length === 0) return;

    const allNfes = parsedData.map(d => d.info);
    const allProds = parsedData.flatMap(d => d.products);
    const consolidated = consolidateProducts(allProds);

    const newBatch: ConferenceBatch = {
      id: Math.random().toString(36).substr(2, 9),
      notes: allNfes,
      products: consolidated,
      startTime: new Date().toISOString(),
      status: 'OPEN',
      conferenteId: currentUser.id,
      conferenteName: currentUser.name
    };

    onStartConference(newBatch);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 text-center">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[32px] p-16 hover:border-[#E66B27] hover:bg-orange-50/30 transition-all group cursor-pointer relative overflow-hidden">
          <input 
            type="file" 
            multiple 
            accept=".xml" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="bg-orange-50 p-6 rounded-3xl group-hover:scale-110 transition-transform mb-6 shadow-inner">
            <Upload className="text-[#E66B27]" size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Importação de NF-e</h3>
          <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Selecione múltiplos arquivos .xml para conferência</p>
          
          <div className="mt-8 flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#E66B27] transition-colors"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#E66B27] delay-75 transition-colors"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#E66B27] delay-150 transition-colors"></div>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
          <div className="p-6 px-10 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="font-black text-white text-xs uppercase tracking-widest">Documentos Preparados</h4>
              <p className="text-slate-500 text-[9px] font-bold uppercase mt-1 tracking-widest">{files.length} arquivos prontos para bipagem</p>
            </div>
            <button 
              onClick={initConference}
              disabled={loading}
              className="bg-[#E66B27] hover:bg-[#d55a1a] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 transform active:scale-95"
            >
              <CheckCircle size={18} />
              Iniciar Conferência
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-8 space-y-4 bg-slate-50/30">
            {parsedData.map((data, idx) => (
              <div key={data.info.accessKey} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm group hover:border-[#E66B27] transition-all">
                <div className="flex items-center gap-5">
                  <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-[#E66B27] group-hover:bg-orange-50 transition-all">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">NF-e: {data.info.number}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 size={12} className="text-slate-400" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                        {getOriginName(data.info.vendorCnpj, data.info.vendorName)}
                      </p>
                      <span className="text-slate-200">|</span>
                      <p className="text-[9px] text-slate-300 font-mono tracking-tighter">{data.info.vendorCnpj}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default XMLUpload;
