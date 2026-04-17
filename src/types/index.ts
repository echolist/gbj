// ─── Enums ────────────────────────────────────────────────────────────────────

export enum DischargeStatus {
  Recovered = 'recovered',
  Deceased = 'deceased',
  SelfDischarge = 'self_discharge',
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string YYYY-MM-DD
  bedNumber: string;
  room: string;
  admissionDate: string; // ISO date string YYYY-MM-DD
  dischargeDate: string | null;
  dischargeStatus: DischargeStatus | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

export interface PatientFilters {
  search: string;
  room: string;
  dischargeStatus: string;
  activeOnly: boolean;
}

// ─── Bed ──────────────────────────────────────────────────────────────────────

export interface Bed {
  id: string;
  bedNumber: string;
  roomType: string;
  isOccupied?: boolean;
  currentPatientId?: string | null;
  currentPatientName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BedFormData = Omit<Bed, 'id' | 'isOccupied' | 'currentPatientId' | 'currentPatientName' | 'createdAt' | 'updatedAt'>;

export interface BedFilters {
  search: string;
  roomType: string;
  status: 'all' | 'occupied' | 'available';
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface BORDataPoint {
  date: string;
  bor: number;
  occupiedBeds: number;
  totalBeds: number;
}

export interface BORSummary {
  averageBOR: number;
  totalOccupiedDays: number;
  totalBeds: number;
  periodDays: number;
  peakBOR: number;
  lowestBOR: number;
}

export interface BORFilters {
  startDate: string;
  endDate: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalPatients: number;
  activePatients: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  currentBOR: number;
  recentDischarges: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'nurse' | 'viewer';
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
