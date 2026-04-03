
import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  CONFERENTE = 'CONFERENTE',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string;
  createdAt?: Timestamp;
}

export interface Branch {
  id: string;
  cnpj: string;
  name: string;
}

export interface NFeProduct {
  id: string;
  code: string;
  ean: string;
  description: string;
  quantityExpected: number;
  quantityChecked: number;
  unit: string;
}

export interface NFeInfo {
  number: string;
  accessKey: string;
  vendorCnpj: string;
  vendorName: string; // Nome extraído do XML (Emitente)
  destCnpj: string;   // CNPJ do Destinatário
  emissionDate: string;
}

export interface ConferenceBatch {
  id: string;
  notes: NFeInfo[];
  products: NFeProduct[];
  startTime: string;
  endTime?: string;
  status: 'READY' | 'OPEN' | 'IN_PROGRESS' | 'PAUSED' | 'PENDING_SUPERVISOR' | 'APPROVED' | 'REJECTED';
  conferenteId: string;
  conferenteName: string;
  creatorId?: string;
  creatorName?: string;
  branchId?: string;
  branchName?: string;
  supervisorId?: string;
  supervisorName?: string;
  justification?: string;
}

export interface DashboardStats {
  totalConferences: number;
  discrepancyRate: number;
  averageTime: string;
  conferenteRanking: { name: string; score: number }[];
}
