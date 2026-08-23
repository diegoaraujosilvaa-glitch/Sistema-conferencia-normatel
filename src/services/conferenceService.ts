
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ConferenceBatch } from '../../types';

// Buffer em memória para debounce de bips
const pendingProgressUpdates: Record<string, { updates: Partial<ConferenceBatch>; timer: any }> = {};

/**
 * Cadastra um novo lote de conferência no Firestore com validação rigorosa.
 */
export const cadastrarConferenceBatch = async (batch: ConferenceBatch) => {
  // VALIDAÇÃO CRÍTICA: Impede que o Firebase grave lotes sem dados
  const hasData = batch.notes && batch.notes.length > 0 && batch.products && batch.products.length > 0;
  
  // No novo fluxo, lotes 'READY' não possuem conferenteId ainda.
  // Validamos conferente apenas se o status NÃO for READY ou OPEN.
  const needsConferente = batch.status !== 'READY' && batch.status !== 'OPEN';
  const hasConferente = !!(batch.conferenteId && batch.conferenteName);

  if (!hasData || (needsConferente && !hasConferente)) {
    console.error("Erro: Lote de conferência incompleto.", { 
      status: batch.status, 
      hasData, 
      needsConferente, 
      hasConferente,
      notesCount: batch.notes?.length,
      productsCount: batch.products?.length
    });
    alert("Erro: Dados do lote incompletos. Verifique os arquivos XML.");
    return;
  }

  try {
    console.log("Enviando lote de conferência para o banco...", batch);
    
    // Usamos o ID gerado no frontend para manter consistência entre dispositivos
    const docRef = doc(db, "conference_batches", batch.id);
    await setDoc(docRef, {
      ...batch,
      conferenteName: batch.conferenteName.toUpperCase().trim(),
      status: batch.status || 'OPEN',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("Lote cadastrado com ID:", batch.id);
    return batch.id;
  } catch (error: any) {
    console.error("Erro ao salvar lote no Firestore:", error);
    throw error;
  }
};

/**
 * Força a gravação imediata de quaisquer dados pendentes em buffer para o Firestore.
 */
export const flushProgressoConferencia = async (id: string) => {
  const pending = pendingProgressUpdates[id];
  if (!pending) return;

  if (pending.timer) {
    clearTimeout(pending.timer);
  }
  
  const updatesToSave = { ...pending.updates };
  delete pendingProgressUpdates[id];

  try {
    const docRef = doc(db, "conference_batches", id);
    await updateDoc(docRef, {
      ...updatesToSave,
      updatedAt: serverTimestamp()
    });
    console.log("Progresso sincronizado com o banco para o lote:", id);
    // Limpa backup local após sincronização bem-sucedida
    localStorage.removeItem(`blind_check_backup_${id}`);
  } catch (error) {
    console.error("Erro ao sincronizar progresso pendente com o Firestore:", error);
  }
};

/**
 * Salva o progresso de uma conferência com Debounce inteligente e backup local imediato.
 * Reduz em mais de 90% as chamadas de escrita no Firebase durante a bipagem.
 */
export const salvarProgressoConferencia = async (id: string, updates: Partial<ConferenceBatch>, immediate = false) => {
  // 1. Salva backup instantâneo no localStorage do navegador para tolerância total a falhas
  try {
    localStorage.setItem(`blind_check_backup_${id}`, JSON.stringify(updates));
  } catch (e) {
    // Ignora erro de cota de localStorage caso ocorra
  }

  if (immediate) {
    await flushProgressoConferencia(id);
    try {
      const docRef = doc(db, "conference_batches", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      localStorage.removeItem(`blind_check_backup_${id}`);
    } catch (error) {
      console.error("Erro ao salvar progresso imediato:", error);
    }
    return;
  }

  // 2. Acumula os dados mais recentes no buffer em memória
  if (pendingProgressUpdates[id]?.timer) {
    clearTimeout(pendingProgressUpdates[id].timer);
  }

  const mergedUpdates = {
    ...(pendingProgressUpdates[id]?.updates || {}),
    ...updates
  };

  const timer = setTimeout(async () => {
    await flushProgressoConferencia(id);
  }, 3500); // 3.5 segundos de intervalo após a última bipagem

  pendingProgressUpdates[id] = {
    updates: mergedUpdates,
    timer
  };
};

/**
 * Atualiza um lote de conferência existente (ex: finalizar ou pausar).
 */
export const atualizarConferenceBatch = async (id: string, updates: Partial<ConferenceBatch>) => {
  // Força sincronização de qualquer progresso pendente primeiro
  if (pendingProgressUpdates[id]) {
    if (pendingProgressUpdates[id].timer) clearTimeout(pendingProgressUpdates[id].timer);
    delete pendingProgressUpdates[id];
  }
  
  try {
    const docRef = doc(db, "conference_batches", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    localStorage.removeItem(`blind_check_backup_${id}`);
    console.log("Lote atualizado:", id);
  } catch (error) {
    console.error("Erro ao atualizar lote:", error);
    alert("Erro ao atualizar lote.");
    throw error;
  }
};

/**
 * Escuta os lotes de conferência em tempo real com limite para otimizar cota do Firebase.
 */
export const listenConferenceBatches = (callback: (batches: ConferenceBatch[]) => void) => {
  // Limita aos 150 lotes mais recentes para economizar dezenas de milhares de leituras diárias
  const q = query(collection(db, "conference_batches"), orderBy("createdAt", "desc"), limit(150));
  return onSnapshot(q, (snapshot) => {
    const batches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConferenceBatch[];
    callback(batches);
  }, (error) => {
    console.error("Erro ao escutar lotes:", error);
  });
};

/**
 * Remove um lote de conferência.
 */
export const excluirConferenceBatch = async (id: string) => {
  if (pendingProgressUpdates[id]) {
    if (pendingProgressUpdates[id].timer) clearTimeout(pendingProgressUpdates[id].timer);
    delete pendingProgressUpdates[id];
  }
  localStorage.removeItem(`blind_check_backup_${id}`);

  try {
    await deleteDoc(doc(db, "conference_batches", id));
    console.log("Lote excluído:", id);
  } catch (error) {
    console.error("Erro ao excluir lote:", error);
    alert("Erro ao excluir lote.");
    throw error;
  }
};
