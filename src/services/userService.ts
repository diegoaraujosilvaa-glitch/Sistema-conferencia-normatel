
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../../types';

/**
 * Cadastra um novo usuário no Firestore seguindo os padrões da Normatel.
 * Resolve o problema de campos vazios e trata erros de permissão.
 */
export const cadastrarUsuarioConferente = async (dados: { name: string; username: string; role: UserRole; password?: string }) => {
  // 1. Validação simples antes de enviar (evita o erro de campos vazios no banco)
  if (!dados.name || !dados.username) {
    console.error("Erro: Nome ou Usuário não preenchidos.");
    alert("Erro: Nome ou Usuário não preenchidos.");
    return;
  }

  try {
    console.log("Tentando gravar no Firebase...", dados);
    
    const docRef = await addDoc(collection(db, "users"), {
      name: dados.name.toUpperCase(), // Padroniza para a Normatel
      username: dados.username.toLowerCase(),
      role: dados.role,
      password: dados.password || '', // Mantendo compatibilidade com o sistema atual
      createdAt: serverTimestamp() // Usa o Timestamp oficial
    });

    console.log("Sucesso! ID gerado:", docRef.id);
    alert("Usuário cadastrado com sucesso!");
    return docRef.id;
  } catch (error: any) {
    // Se cair aqui com "insufficient permissions", a regra não foi publicada
    console.error("Erro detalhado do Firebase:", error.code, error.message);
    if (error.code === 'permission-denied') {
      alert("Erro de permissão! Verifique se publicou as regras no console.");
    } else {
      alert("Erro ao cadastrar usuário. Verifique o console.");
    }
    throw error;
  }
};
