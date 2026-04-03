
import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, Building2, AlertTriangle, MapPin } from 'lucide-react';
import { parseNFeXML, consolidateProducts } from '../services/xmlParser';
import { NFeInfo, NFeProduct, ConferenceBatch, User, Branch } from '../types';

interface XMLUploadProps {
  currentUser: User;
  branches: Branch[];
  onCreateBatch: (batch: ConferenceBatch) => void;
}

const XMLUpload: React.FC<XMLUploadProps> = ({ currentUser, branches, onCreateBatch }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<{ info: NFeInfo; products: NFeProduct[] }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

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
      const msg = err instanceof Error ? err.message : "Verifique a integridade dos arquivos.";
      alert(`Erro ao processar um ou mais arquivos XML: ${msg}`);
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

  const getBranchNameByCnpj = (cnpj: string) => {
    const found = branches.find(b => b.cnpj === cnpj);
    return found ? found.name : null;
  };

  const initBatch = () => {
    setAttemptedSubmit(true);
    if (parsedData.length === 0) {
      alert("Por favor, importe ao menos um arquivo XML.");
      return;
    }

    if (!selectedBranchId) {
      // O feedback visual agora é feito via estado attemptedSubmit
      return;
    }

    const allNfes = parsedData.map(d => d.info);
    const allProds = parsedData.flatMap(d => d.products);
    
    // VALIDAÇÃO CRÍTICA: Impede que o lote seja criado sem produtos ou notas
    if (allNfes.length === 0 || allProds.length === 0) {
      console.error("Lote incompleto:", { nfeCount: allNfes.length, productCount: allProds.length });
      alert("Erro: Dados do lote incompletos. Verifique os arquivos XML.");
      return;
    }

    const consolidated = consolidateProducts(allProds);
    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    const newBatch: ConferenceBatch = {
      id: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      notes: allNfes,
      products: consolidated,
      startTime: new Date().toISOString(),
      status: 'READY',
      conferenteId: '',
      conferenteName: 'Aguardando Conferente',
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      branchId: selectedBranch?.id,
      branchName: selectedBranch?.name
    };

    console.log("Criando novo lote de conferência...", newBatch);
    onCreateBatch(newBatch);
    setFiles([]);
    setParsedData([]);
    setSelectedBranchId('');
    setAttemptedSubmit(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-4 sm:p-10 rounded-xl shadow-sm border border-slate-100">
        <div className="mb-8 max-w-xs mx-auto">
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 text-center transition-colors ${attemptedSubmit && !selectedBranchId ? 'text-red-500' : 'text-slate-400'}`}>
            Filial de Destino
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              if (e.target.value) setAttemptedSubmit(false);
            }}
            className={`w-full bg-slate-50 border rounded-md px-4 py-3 text-xs font-bold uppercase tracking-tight focus:ring-2 focus:outline-none transition-all ${attemptedSubmit && !selectedBranchId ? 'border-red-500 focus:ring-red-500 animate-shake' : 'border-slate-200 focus:ring-[#E66B27] focus:border-transparent'}`}
          >
            <option value="">Selecione a Filial...</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          {attemptedSubmit && !selectedBranchId && (
            <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 text-center animate-in fade-in slide-in-from-top-1">
              Informação Obrigatória
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-8 sm:p-16 hover:border-[#E66B27] hover:bg-orange-50/30 transition-all group cursor-pointer relative overflow-hidden">
          <input 
            type="file" 
            multiple 
            accept=".xml" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="bg-orange-50 p-6 rounded-md group-hover:scale-110 transition-transform mb-6 shadow-inner">
            <Upload className="text-[#E66B27]" size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Importação de NF-e</h3>
          <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Selecione múltiplos arquivos .xml para criar lotes</p>
          
          <div className="mt-8 flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#E66B27] transition-colors"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#E66B27] delay-75 transition-colors"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#E66B27] delay-150 transition-colors"></div>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
          <div className="p-4 sm:p-6 px-4 sm:px-10 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-black text-white text-xs uppercase tracking-widest">Documentos Preparados</h4>
              <p className="text-slate-500 text-[9px] font-bold uppercase mt-1 tracking-widest">{files.length} arquivos prontos para criação de lote</p>
            </div>
            <button 
              onClick={initBatch}
              disabled={loading}
              className="w-full sm:w-auto bg-[#E66B27] hover:bg-[#d55a1a] text-white px-8 py-3.5 rounded-md font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 transform active:scale-95"
            >
              <CheckCircle size={18} />
              Criar Lote de Conferência
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-8 space-y-4 bg-slate-50/30">
            {parsedData.map((data, idx) => (
              <div key={data.info.accessKey} className="flex items-center justify-between p-5 bg-white rounded-md border border-slate-100 shadow-sm group hover:border-[#E66B27] transition-all">
                <div className="flex items-center gap-5">
                  <div className="bg-slate-50 p-3 rounded-md text-slate-400 group-hover:text-[#E66B27] group-hover:bg-orange-50 transition-all">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">NF-e: {data.info.number}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-slate-600" />
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[200px]">
                          Emitente: {getOriginName(data.info.vendorCnpj, data.info.vendorName)}
                        </p>
                        <span className="text-slate-300">|</span>
                        <p className="text-[9px] text-slate-500 font-mono tracking-tighter">CNPJ: {data.info.vendorCnpj}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-[#E66B27]" />
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate max-w-[200px]">
                          Destinatário: {getBranchNameByCnpj(data.info.destCnpj) || 'Não Identificado'}
                        </p>
                        <span className="text-slate-300">|</span>
                        <p className="text-[9px] text-slate-600 font-mono tracking-tighter font-bold">CNPJ: {data.info.destCnpj}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-all">
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
