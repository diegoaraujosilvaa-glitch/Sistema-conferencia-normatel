
import { User, UserRole, Branch } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin Principal', username: 'admin', role: UserRole.ADMIN, password: '123' },
  { id: '2', name: 'João Conferente', username: 'joao', role: UserRole.CONFERENTE, password: '123' },
  { id: '3', name: 'Maria Supervisor', username: 'maria', role: UserRole.SUPERVISOR, password: '05171888302' },
  { id: '4', name: 'Diego Silva', username: 'DIEGO.SILVA', role: UserRole.ADMIN, password: '05171888302' }
];

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', cnpj: '09267050000104', name: 'Filial AS' },
  { id: 'b2', cnpj: '09267050000376', name: 'Filial BM' },
  { id: 'b3', cnpj: '09267050000708', name: 'Filial VT' },
  { id: 'b4', cnpj: '09267050000457', name: 'Filial CD' },
  { id: 'b5', cnpj: '09267050000880', name: 'Filial JN' },
  { id: 'b6', cnpj: '09267050001003', name: 'Filial SD' },
  { id: 'b7', cnpj: '09267050001186', name: 'Filial PJ' },
  { id: 'b8', cnpj: '09267050001267', name: 'Filial CB' },
  { id: 'b9', cnpj: '09267050001771', name: 'Filial EB' },
  { id: 'b10', cnpj: '09267050001429', name: 'Filial JQ' },
  { id: 'b11', cnpj: '09267050001690', name: 'Filial MA' },
  { id: 'b12', cnpj: '09267050001348', name: 'Filial TZ' },
  { id: 'b13', cnpj: '09267050001852', name: 'Filial PD' },
  { id: 'b14', cnpj: '09267050001933', name: 'Filial AV' }
];

export const STORAGE_KEYS = {
  USERS: 'checkmaster_users',
  BRANCHES: 'checkmaster_branches',
  BATCHES: 'checkmaster_batches',
  CURRENT_USER: 'checkmaster_session',
  ACTIVE_BATCH: 'checkmaster_active_batch',
  PAUSED_BATCHES: 'checkmaster_paused_batches'
};
