
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ConferenceBatch } from '../../types';

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
 * Salva o progresso de uma conferência em andamento.
 */
export const salvarProgressoConferencia = async (id: string, updates: Partial<ConferenceBatch>) => {
  try {
    const docRef = doc(db, "conference_batches", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
    // Não alertamos aqui para não interromper o fluxo do usuário em cada clique
  }
};

/**
 * Atualiza um lote de conferência existente (ex: finalizar ou pausar).
 */
export const atualizarConferenceBatch = async (id: string, updates: Partial<ConferenceBatch>) => {
  try {
    const docRef = doc(db, "conference_batches", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log("Lote atualizado:", id);
  } catch (error) {
    console.error("Erro ao atualizar lote:", error);
    alert("Erro ao atualizar lote.");
    throw error;
  }
};

/**
 * Escuta os lotes de conferência em tempo real.
 */
export const listenConferenceBatches = (callback: (batches: ConferenceBatch[]) => void) => {
  const q = query(collection(db, "conference_batches"), orderBy("createdAt", "desc"));
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
  try {
    await deleteDoc(doc(db, "conference_batches", id));
    console.log("Lote excluído:", id);
  } catch (error) {
    console.error("Erro ao excluir lote:", error);
    alert("Erro ao excluir lote.");
    throw error;
  }
};
