
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { DashboardStats } from '../../types';

/**
 * Atualiza as estatísticas do dashboard no Firestore com validação rigorosa.
 */
export const atualizarDashboardStats = async (stats: DashboardStats) => {
  // VALIDAÇÃO CRÍTICA: Impede que o Firebase grave "" em campos essenciais
  if (stats.totalConferences < 0 || stats.discrepancyRate < 0 || !stats.averageTime.trim()) {
    console.error("Erro: Estatísticas do dashboard inválidas.");
    alert("Erro: Dados de estatísticas incompletos.");
    return;
  }

  try {
    console.log("Enviando estatísticas para o banco...", stats);
    
    const docRef = doc(db, "dashboard_stats", "main");
    await setDoc(docRef, {
      ...stats,
      averageTime: stats.averageTime.trim(),
      updatedAt: serverTimestamp()
    });

    console.log("Estatísticas atualizadas com sucesso!");
  } catch (error: any) {
    console.error("Erro ao salvar estatísticas no Firestore:", error);
    if (error.code === 'permission-denied') {
      alert("Erro de permissão! Verifique as regras do Firestore.");
    } else {
      alert("Erro ao salvar estatísticas. Verifique o console.");
    }
    throw error;
  }
};

/**
 * Escuta as estatísticas do dashboard em tempo real.
 */
export const listenDashboardStats = (callback: (stats: DashboardStats) => void) => {
  const docRef = doc(db, "dashboard_stats", "main");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as DashboardStats);
    }
  }, (error) => {
    console.error("Erro ao escutar estatísticas:", error);
  });
};
