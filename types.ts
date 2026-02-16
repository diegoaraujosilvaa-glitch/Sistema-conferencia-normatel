
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
}

export interface NFeInfo {
  number: string;
  accessKey: string;
  vendorCnpj: string;
  vendorName: string; // Nome extraído do XML (Emitente)
  emissionDate: string;
}

export interface ConferenceBatch {
  id: string;
  notes: NFeInfo[];
  products: NFeProduct[];
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'PENDING_SUPERVISOR' | 'APPROVED' | 'REJECTED';
  conferenteId: string;
  conferenteName: string;
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
