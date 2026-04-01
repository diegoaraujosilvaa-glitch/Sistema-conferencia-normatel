
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { NFeProduct } from '../../types';

/**
 * Cadastra um novo produto no Firestore com validação rigorosa.
 */
export const cadastrarProduto = async (produto: Omit<NFeProduct, 'id'>) => {
  // VALIDAÇÃO CRÍTICA: Impede que o Firebase grave "" em campos essenciais
  if (!produto.code.trim() || !produto.description.trim()) {
    console.error("Erro: Código ou Descrição do produto não preenchidos.");
    alert("Erro: Preencha os dados obrigatórios do produto.");
    return;
  }

  try {
    console.log("Enviando produto para o banco...", produto);
    
    const docRef = await addDoc(collection(db, "products"), {
      ...produto,
      code: produto.code.toUpperCase().trim(),
      description: produto.description.toUpperCase().trim(),
      ean: produto.ean.trim(),
      createdAt: serverTimestamp()
    });

    console.log("Produto cadastrado com sucesso! ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("Erro ao salvar produto no Firestore:", error);
    if (error.code === 'permission-denied') {
      alert("Erro de permissão! Verifique as regras do Firestore.");
    } else {
      alert("Erro ao salvar produto. Verifique o console.");
    }
    throw error;
  }
};

/**
 * Escuta os produtos em tempo real.
 */
export const listenProducts = (callback: (products: NFeProduct[]) => void) => {
  const q = query(collection(db, "products"), orderBy("description", "asc"));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NFeProduct[];
    callback(products);
  }, (error) => {
    console.error("Erro ao escutar produtos:", error);
  });
};

/**
 * Exclui um produto do Firestore.
 */
export const excluirProduto = async (id: string) => {
  try {
    await deleteDoc(doc(db, "products", id));
    console.log("Produto excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    throw error;
  }
};
