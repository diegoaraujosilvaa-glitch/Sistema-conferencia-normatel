
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ConferenceBatch } from '../../types';

/**
 * Cadastra um novo lote de conferência no Firestore com validação rigorosa.
 */
export const cadastrarConferenceBatch = async (batch: Omit<ConferenceBatch, 'id'>) => {
  // VALIDAÇÃO CRÍTICA: Impede que o Firebase grave "" em campos essenciais
  if (!batch.conferenteId || !batch.conferenteName || batch.notes.length === 0 || batch.products.length === 0) {
    console.error("Erro: Lote de conferência incompleto.");
    alert("Erro: Dados do lote incompletos. Verifique os arquivos XML.");
    return;
  }

  try {
    console.log("Enviando lote de conferência para o banco...", batch);
    
    const docRef = await addDoc(collection(db, "conference_batches"), {
      ...batch,
      conferenteName: batch.conferenteName.toUpperCase().trim(),
      status: batch.status || 'OPEN',
      createdAt: serverTimestamp()
    });

    console.log("Lote cadastrado com ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("Erro ao salvar lote no Firestore:", error);
    if (error.code === 'permission-denied') {
      alert("Erro de permissão! Verifique as regras do Firestore.");
    } else {
      alert("Erro ao salvar lote. Verifique o console.");
    }
    throw error;
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
