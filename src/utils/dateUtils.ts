import { format, parseISO, differenceInYears, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    // Handle both ISO dates and date-only strings like "2024-01-15"
    const date = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr + 'T00:00:00');
    if (!isValid(date)) return '-';
    return format(date, 'dd MMM yyyy', { locale: id });
  } catch {
    return '-';
  }
}

export function formatDateInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr + 'T00:00:00');
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export function calculateAge(dateOfBirth: string): number {
  try {
    const dob = new Date(dateOfBirth + 'T00:00:00');
    return differenceInYears(new Date(), dob);
  } catch {
    return 0;
  }
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getDateRangeDefaults(): { startDate: string; endDate: string } {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: format(firstDay, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  };
}
