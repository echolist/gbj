import axios from 'axios';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxDf9qfAEAogZJjhcV8z5_4Jg_n91ZX1hCkS_-4er0qiYchLn7h6nC_yXIo_2UdY1CI/exec';

export const sheetsApi = axios.create({
  baseURL: SCRIPT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generic GET request via Apps Script Web API
 * Apps Script GET expects ?action=...&sheet=...
 */
export async function apiFetch<T>(params: Record<string, string>): Promise<T> {
  const response = await sheetsApi.get('', { params });
  if (response.data?.status === 'error') {
    throw new Error(response.data.message || response.data.error || 'API Error');
  }
  return response.data?.data ?? response.data;
}

/**
 * Generic POST request via Apps Script Web API
 * Apps Script POST expects JSON body with { action, sheet, data }
 */
export async function apiPost<T>(body: Record<string, unknown>): Promise<T> {
  // Google Apps Script doesn't support CORS preflight (OPTIONS) requests natively.
  // To bypass this, we use 'text/plain' as the Content-Type. This forces a "Simple Request",
  // meaning no OPTIONS preflight is sent, and Apps Script's automatic redirect handles the rest.
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (data?.status === 'error') {
    throw new Error(data.message || data.error || 'API Error');
  }
  return data?.data ?? data;
}

export const SHEETS = {
  PATIENTS: 'Patients',
  BEDS: 'Beds',
} as const;
