
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { User, UserRole, ConferenceBatch, Branch, DashboardStats } from './types';
import { INITIAL_USERS, INITIAL_BRANCHES, STORAGE_KEYS } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import XMLUpload from './components/XMLUpload';
import BlindCheck from './components/BlindCheck';
import AdminPanel from './components/AdminPanel';
import BranchPanel from './components/BranchPanel';
import ReportModal from './components/ReportModal';
import PausedBatches from './components/PausedBatches';
import AvailableBatches from './components/AvailableBatches';
import DiscrepancyModule from './components/DiscrepancyModule';
import ActiveConferences from './components/ActiveConferences';
import { PackageCheck, ShieldCheck } from 'lucide-react';
import { listenBranches } from './src/services/branchService';
import { listenConferenceBatches, cadastrarConferenceBatch, atualizarConferenceBatch } from './src/services/conferenceService';
import { listenDashboardStats } from './src/services/statsService';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // Sync Users from Firestore
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // Se não houver usuários no Firestore, podemos usar os iniciais ou manter vazio
      if (usersData.length > 0) {
        setUsers(usersData);
      } else {
        setUsers(INITIAL_USERS);
      }
    }, (error) => {
      console.error("Erro ao buscar usuários do Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [batches, setBatches] = useState<ConferenceBatch[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Sync Branches from Firestore
  useEffect(() => {
    const unsubscribe = listenBranches((data) => {
      if (data.length > 0) setBranches(data);
      else setBranches(INITIAL_BRANCHES);
    });
    return () => unsubscribe();
  }, []);

  // Sync Batches from Firestore
  useEffect(() => {
    const unsubscribe = listenConferenceBatches((data) => {
      setBatches(data);
    });
    return () => unsubscribe();
  }, []);

  // Sync Stats from Firestore
  useEffect(() => {
    const unsubscribe = listenDashboardStats((data) => {
      setStats(data);
    });
    return () => unsubscribe();
  }, []);

  // Update Dashboard Stats in Firestore when batches change
  useEffect(() => {
    const validBatches = batches.filter(b => b.status !== 'READY');
    if (validBatches.length > 0) {
      const totalConferences = validBatches.length;
      const totalDivergences = validBatches.filter(b => 
        b.products.some(p => parseFloat(p.quantityExpected.toFixed(3)) !== parseFloat(p.quantityChecked.toFixed(3)))
      ).length;
      
      const accuracyRate = totalConferences > 0 ? ((totalConferences - totalDivergences) / totalConferences) * 100 : 100;
      
      const map: Record<string, { count: number, accuracy: number }> = {};
      validBatches.forEach(b => {
        if (!map[b.conferenteName]) map[b.conferenteName] = { count: 0, accuracy: 0 };
        map[b.conferenteName].count += 1;
        const hasDiv = b.products.some(p => parseFloat(p.quantityExpected.toFixed(3)) !== parseFloat(p.quantityChecked.toFixed(3)));
        if (!hasDiv) map[b.conferenteName].accuracy += 1;
      });

      const ranking = Object.entries(map)
        .map(([name, data]) => ({
          name,
          score: (data.accuracy / data.count) * 100
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const newStats: DashboardStats = {
        totalConferences,
        discrepancyRate: 100 - accuracyRate,
        averageTime: "Calculando...", // Poderia ser calculado se tivéssemos startTime e endTime como Timestamps
        conferenteRanking: ranking
      };

      // Importar e chamar a função de atualização
      import('./src/services/statsService').then(({ atualizarDashboardStats }) => {
        atualizarDashboardStats(newStats).catch(err => console.error("Erro ao atualizar estatísticas globais:", err));
      });
    }
  }, [batches]);
  
  // Lote Ativo (Sincronizado com Firestore)
  const [currentBatch, setCurrentBatch] = useState<ConferenceBatch | null>(null);

  // Fila de Lotes Pausados (Derivado do Firestore)
  const pausedBatches = useMemo(() => {
    return batches.filter(b => b.status === 'PAUSED');
  }, [batches]);

  const activeBatches = useMemo(() => {
    return batches.filter(b => b.status === 'IN_PROGRESS');
  }, [batches]);

  const pendingDiscrepancies = useMemo(() => {
    return batches.filter(b => b.status === 'PENDING_SUPERVISOR');
  }, [batches]);

  // Efeito para recuperar a conferência ativa do usuário logado ao iniciar
  useEffect(() => {
    if (user && batches.length > 0 && !currentBatch) {
      const active = batches.find(b => b.status === 'IN_PROGRESS' && b.conferenteId === user.id);
      if (active) {
        setCurrentBatch(active);
        setActiveTab('checking');
      }
    }
  }, [user, batches, currentBatch]);

  const [viewingReport, setViewingReport] = useState<ConferenceBatch | null>(null);

  // Handlers
  const handleCreateBatch = async (batch: ConferenceBatch) => {
    try {
      await cadastrarConferenceBatch(batch);
      setActiveTab('available');
    } catch (error) {
      console.error("Erro ao criar lote de conferência:", error);
    }
  };

  const handleSelectBatch = async (batch: ConferenceBatch) => {
    if (!user) return;

    // Verifica se o lote já está sendo conferido por outro usuário
    const isAlreadyInProgress = batches.find(b => b.id === batch.id && b.status === 'IN_PROGRESS' && b.conferenteId !== user.id);
    if (isAlreadyInProgress) {
      alert(`Este lote já está sendo conferido por ${isAlreadyInProgress.conferenteName}.`);
      return;
    }

    try {
      // Se já houver uma ativa, pausa ela no Firestore primeiro
      if (currentBatch) {
        await atualizarConferenceBatch(currentBatch.id, { status: 'PAUSED' });
      }
      
      // Atribui o conferente e inicia no Firestore com status IN_PROGRESS
      const updatedBatch = { 
        ...batch, 
        status: 'IN_PROGRESS' as const,
        conferenteId: user.id,
        conferenteName: user.name,
        startTime: new Date().toISOString() // Reinicia o tempo ao começar de fato
      };
      await atualizarConferenceBatch(batch.id, updatedBatch);
      
      setCurrentBatch(updatedBatch);
      setActiveTab('checking');
    } catch (error) {
      console.error("Erro ao selecionar lote:", error);
    }
  };

  const handlePauseActive = async () => {
    if (currentBatch) {
      try {
        await atualizarConferenceBatch(currentBatch.id, { status: 'PAUSED' });
        setCurrentBatch(null);
        setActiveTab('upload');
      } catch (error) {
        console.error("Erro ao pausar conferência:", error);
      }
    }
  };

  const handleResumeBatch = async (batchToResume: ConferenceBatch) => {
    if (!user) return;

    // Verifica se o lote já está sendo conferido por outro usuário
    const isAlreadyInProgress = batches.find(b => b.id === batchToResume.id && b.status === 'IN_PROGRESS' && b.conferenteId !== user.id);
    if (isAlreadyInProgress) {
      alert(`Este lote já está sendo conferido por ${isAlreadyInProgress.conferenteName}.`);
      return;
    }

    try {
      if (currentBatch) {
        const confirmPause = window.confirm("Você possui uma conferência ativa agora. Deseja pausá-la para retomar esta?");
        if (confirmPause) {
          await atualizarConferenceBatch(currentBatch.id, { status: 'PAUSED' });
          const updatedBatch = { 
            ...batchToResume, 
            status: 'IN_PROGRESS' as const,
            conferenteId: user.id,
            conferenteName: user.name
          };
          await atualizarConferenceBatch(batchToResume.id, updatedBatch);
          setCurrentBatch(updatedBatch);
          setActiveTab('checking');
        }
      } else {
        const updatedBatch = { 
          ...batchToResume, 
          status: 'IN_PROGRESS' as const,
          conferenteId: user.id,
          conferenteName: user.name
        };
        await atualizarConferenceBatch(batchToResume.id, updatedBatch);
        setCurrentBatch(updatedBatch);
        setActiveTab('checking');
      }
    } catch (error) {
      console.error("Erro ao retomar conferência:", error);
    }
  };

  const deletePausedBatch = async (id: string) => {
    try {
      const { excluirConferenceBatch } = await import('./src/services/conferenceService');
      await excluirConferenceBatch(id);
    } catch (error) {
      console.error("Erro ao excluir lote pausado:", error);
    }
  };

  const handleUpdateBatchProgress = (updatedBatch: ConferenceBatch) => {
    setCurrentBatch(updatedBatch);
    // Salva o progresso no Firestore (pode ser debounced se necessário)
    import('./src/services/conferenceService').then(({ salvarProgressoConferencia }) => {
      salvarProgressoConferencia(updatedBatch.id, { products: updatedBatch.products });
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (found) {
      setUser(found);
      setLoginError('');
      if (currentBatch) setActiveTab('checking');
      else if (found.role === UserRole.CONFERENTE) setActiveTab('available');
      else setActiveTab('dashboard');
    } else {
      setLoginError('Credenciais inválidas.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginForm({ username: '', password: '' });
    setLoginError('');
    setActiveTab('dashboard');
    setViewingReport(null);
    setCurrentBatch(null);
  };

  const finalizeConference = async () => {
    if (!currentBatch) return;
    const hasDivergence = currentBatch.products.some(p => p.quantityExpected !== p.quantityChecked);
    
    try {
      if (hasDivergence) {
        // Envia para o módulo de divergências
        const pendingBatch = { 
          ...currentBatch, 
          status: 'PENDING_SUPERVISOR' as const, 
          endTime: new Date().toISOString() 
        };
        await atualizarConferenceBatch(currentBatch.id, pendingBatch);
        setCurrentBatch(null);
        setActiveTab('available');
      } else {
        const finalBatch = { 
          ...currentBatch, 
          status: 'APPROVED' as const, 
          endTime: new Date().toISOString() 
        };
        await atualizarConferenceBatch(currentBatch.id, finalBatch);
        setCurrentBatch(null);
        setActiveTab('history');
        setViewingReport(finalBatch);
      }
    } catch (error) {
      console.error("Erro ao finalizar conferência:", error);
    }
  };

  const handleDiscrepancyApprove = async (batch: ConferenceBatch, supervisor: User, justification: string) => {
    try {
      const finalBatch = { 
        ...batch, 
        status: 'APPROVED' as const, 
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        justification
      };
      await atualizarConferenceBatch(batch.id, finalBatch);
    } catch (error) {
      console.error("Erro ao aprovar divergência:", error);
    }
  };

  const handleDiscrepancyReject = async (batch: ConferenceBatch) => {
    try {
      // Volta para conferência (status PAUSED)
      await atualizarConferenceBatch(batch.id, { status: 'PAUSED' });
    } catch (error) {
      console.error("Erro ao rejeitar divergência:", error);
    }
  };

  // UI Logic
  let content;
  if (currentBatch && activeTab === 'checking') {
    content = <BlindCheck batch={currentBatch} onUpdateBatch={handleUpdateBatchProgress} onFinish={finalizeConference} onCancel={() => { deletePausedBatch(currentBatch.id); setCurrentBatch(null); setActiveTab('upload'); }} onPause={handlePauseActive} />;
  } else {
    switch (activeTab) {
      case 'dashboard': content = <Dashboard batches={batches} firestoreStats={stats} />; break;
      case 'upload': content = <XMLUpload currentUser={user!} branches={branches} onCreateBatch={handleCreateBatch} />; break;
      case 'available': content = <AvailableBatches batches={batches} onSelect={handleSelectBatch} onDelete={deletePausedBatch} userRole={user?.role} />; break;
      case 'active_monitor': content = <ActiveConferences activeBatches={activeBatches} />; break;
      case 'paused': content = <PausedBatches pausedBatches={pausedBatches} onResume={handleResumeBatch} onDelete={deletePausedBatch} />; break;
      case 'discrepancies': content = <DiscrepancyModule batches={batches} users={users} onApprove={handleDiscrepancyApprove} onReject={handleDiscrepancyReject} />; break;
      case 'history': content = (
        <div className="bg-white rounded-md shadow-sm border border-slate-100 overflow-hidden max-w-7xl mx-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr><th className="px-6 py-4">Data/Hora</th><th className="px-6 py-4">Manifesto ID</th><th className="px-6 py-4">Conferente</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {batches
                .filter(b => !['IN_PROGRESS', 'PAUSED', 'READY', 'PENDING_SUPERVISOR'].includes(b.status))
                .map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(b.endTime || b.startTime).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-mono font-black text-[#E66B27] uppercase tracking-tighter">#{b.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{b.conferenteName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase ${b.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{b.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setViewingReport(b)} className="bg-slate-100 text-slate-600 hover:bg-[#E66B27] hover:text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all">Relatório</button>
                  </td>
                </tr>
              ))}
              {batches.filter(b => !['IN_PROGRESS', 'PAUSED', 'READY', 'PENDING_SUPERVISOR'].includes(b.status)).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest opacity-40">Nenhum manifesto concluído</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ); break;
      case 'branches': content = <BranchPanel branches={branches} onAddBranch={(b) => setBranches(prev => [...prev, b])} onDeleteBranch={(id) => setBranches(prev => prev.filter(b => b.id !== id))} />; break;
      case 'admin': content = <AdminPanel users={users} currentUser={user!} onAddUser={(u) => setUsers(prev => [...prev, u])} onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))} onUpdateUser={(u) => setUsers(prev => prev.map(us => us.id === u.id ? u : us))} />; break;
      default: content = <Dashboard batches={batches} />;
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/10">
          <div className="p-10 text-center bg-slate-50 border-b border-slate-100 relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-[#E66B27]"></div>
            <div className="bg-[#E66B27] w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
              <PackageCheck className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">Normatel Home Center</h1>
            <p className="text-[#E66B27] text-[10px] font-black uppercase tracking-[0.3em] mt-1">Sistema de Conferência</p>
          </div>
          <div className="p-10">
            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Matrícula / Login</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-5 py-4 focus:ring-2 focus:ring-[#E66B27] outline-none transition-all font-medium" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} placeholder="Seu login" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha de Acesso</label>
                <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-md px-5 py-4 focus:ring-2 focus:ring-[#E66B27] outline-none transition-all" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="••••••••" required />
              </div>
              {loginError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded">{loginError}</p>}
              <button type="submit" className="w-full bg-[#E66B27] hover:bg-[#d55a1a] text-white font-black py-5 rounded-md shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group text-xs uppercase tracking-[0.2em] transform active:scale-95">
                Entrar no Sistema
              </button>
            </form>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">CheckMaster Logistics v2.9.4</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      pausedCount={pausedBatches.length}
      discrepancyCount={pendingDiscrepancies.length}
    >
      {content}
      {viewingReport && <ReportModal batch={viewingReport} onClose={() => setViewingReport(null)} />}
    </Layout>
  );
};

export default App;
