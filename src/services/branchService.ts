
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Branch } from '../../types';

/**
 * Cadastra uma nova filial no Firestore com validação rigorosa.
 */
export const cadastrarBranch = async (dados: { name: string; cnpj: string }) => {
  // VALIDAÇÃO CRÍTICA: Impede que o Firebase grave ""
  if (!dados.name.trim() || !dados.cnpj.trim()) {
    console.error("Erro: Nome ou CNPJ não preenchidos.");
    alert("Por favor, preencha todos os campos da filial.");
    return;
  }

  try {
    console.log("Enviando filial para o banco...", dados);
    
    const docRef = await addDoc(collection(db, "branches"), {
      name: dados.name.toUpperCase().trim(), // Padroniza para caixa alta
      cnpj: dados.cnpj.replace(/\D/g, ''),   // Salva apenas os números do CNPJ
      createdAt: new Date().toISOString()
    });

    console.log("Filial cadastrada com ID:", docRef.id);
    alert("Filial cadastrada com sucesso!");
    return docRef.id;
  } catch (error: any) {
    console.error("Erro ao salvar filial no Firestore:", error);
    if (error.code === 'permission-denied') {
      alert("Erro de permissão! Verifique as regras do Firestore.");
    } else {
      alert("Erro ao salvar filial. Verifique o console.");
    }
    throw error;
  }
};

/**
 * Remove uma filial do Firestore.
 */
export const excluirBranch = async (id: string) => {
  try {
    await deleteDoc(doc(db, "branches", id));
    console.log("Filial excluída:", id);
  } catch (error) {
    console.error("Erro ao excluir filial:", error);
    alert("Erro ao excluir filial.");
    throw error;
  }
};

/**
 * Escuta as filiais em tempo real.
 */
export const listenBranches = (callback: (branches: Branch[]) => void) => {
  const q = query(collection(db, "branches"), orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const branches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Branch[];
    callback(branches);
  }, (error) => {
    console.error("Erro ao escutar filiais:", error);
  });
};
