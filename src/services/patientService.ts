import { apiFetch, apiPost, SHEETS } from './api';
import type { Patient, PatientFormData } from '../types';

export const patientService = {
  /** Fetch all patients */
  async getAll(): Promise<Patient[]> {
    const data = await apiFetch<Patient[]>({ action: 'getAll', sheet: SHEETS.PATIENTS });
    return Array.isArray(data) ? data : [];
  },

  /** Fetch a single patient by id */
  async getById(id: string): Promise<Patient> {
    return apiFetch<Patient>({ action: 'getById', sheet: SHEETS.PATIENTS, id });
  },

  /** Create new patient */
  async create(data: PatientFormData): Promise<Patient> {
    return apiPost<Patient>({
      action: 'create',
      sheet: SHEETS.PATIENTS,
      data,
    });
  },

  /** Update existing patient */
  async update(id: string, data: Partial<PatientFormData>): Promise<Patient> {
    return apiPost<Patient>({
      action: 'update',
      sheet: SHEETS.PATIENTS,
      id,
      data,
    });
  },

  /** Delete a patient */
  async delete(id: string): Promise<void> {
    await apiPost({
      action: 'delete',
      sheet: SHEETS.PATIENTS,
      id,
    });
  },
};
