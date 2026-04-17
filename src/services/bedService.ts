import { apiFetch, apiPost, SHEETS } from './api';
import type { Bed, BedFormData } from '../types';

export const bedService = {
  /** Fetch all beds */
  async getAll(): Promise<Bed[]> {
    const data = await apiFetch<Bed[]>({ action: 'getAll', sheet: SHEETS.BEDS });
    return Array.isArray(data) ? data : [];
  },

  /** Create new bed */
  async create(data: BedFormData): Promise<Bed> {
    return apiPost<Bed>({
      action: 'create',
      sheet: SHEETS.BEDS,
      data,
    });
  },

  /** Update bed */
  async update(id: string, data: Partial<BedFormData>): Promise<Bed> {
    return apiPost<Bed>({
      action: 'update',
      sheet: SHEETS.BEDS,
      id,
      data,
    });
  },

  /** Delete a bed */
  async delete(id: string): Promise<void> {
    await apiPost({
      action: 'delete',
      sheet: SHEETS.BEDS,
      id,
    });
  },

  /** Assign patient to bed */
  async assignPatient(bedId: string, patientId: string, patientName: string): Promise<Bed> {
    return apiPost<Bed>({
      action: 'assignPatient',
      sheet: SHEETS.BEDS,
      bedId,
      patientId,
      patientName,
    });
  },

  /** Release bed from patient */
  async releaseBed(bedId: string): Promise<Bed> {
    return apiPost<Bed>({
      action: 'releaseBed',
      sheet: SHEETS.BEDS,
      bedId,
    });
  },
};
