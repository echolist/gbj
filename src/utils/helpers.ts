import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DischargeStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDischargeStatusLabel(status: DischargeStatus | null | undefined): string {
  switch (status) {
    case DischargeStatus.Recovered:
      return 'Sembuh';
    case DischargeStatus.Deceased:
      return 'Meninggal';
    case DischargeStatus.SelfDischarge:
      return 'Pulang APS';
    default:
      return 'Aktif';
  }
}

export function getDischargeStatusClass(status: DischargeStatus | null | undefined): string {
  switch (status) {
    case DischargeStatus.Recovered:
      return 'badge-recovered';
    case DischargeStatus.Deceased:
      return 'badge-deceased';
    case DischargeStatus.SelfDischarge:
      return 'badge-self-discharge';
    default:
      return 'badge-active';
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? '' : String(val);
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function isActivePatient(patient: { dischargeDate: string | null }): boolean {
  return !patient.dischargeDate;
}
