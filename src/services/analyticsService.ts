import { differenceInDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { Patient, Bed, BORDataPoint, BORSummary } from '../types';

/**
 * Calculate BOR for each day in a date range.
 * BOR = (Occupied Bed Days / (Total Beds * Number of Days)) * 100
 */
export function calculateDailyBOR(
  patients: Patient[],
  beds: Bed[],
  startDate: string,
  endDate: string
): { dataPoints: BORDataPoint[]; summary: BORSummary } {
  const totalBeds = beds.length;
  if (totalBeds === 0) {
    return {
      dataPoints: [],
      summary: {
        averageBOR: 0,
        totalOccupiedDays: 0,
        totalBeds: 0,
        periodDays: 0,
        peakBOR: 0,
        lowestBOR: 0,
      },
    };
  }

  const start = startOfDay(parseISO(startDate));
  const end = endOfDay(parseISO(endDate));
  const periodDays = differenceInDays(end, start) + 1;

  const dataPoints: BORDataPoint[] = [];
  let totalOccupiedDays = 0;

  for (let i = 0; i < periodDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    // Count patients admitted on this date
    const occupiedBeds = patients.filter((patient) => {
      const admission = startOfDay(parseISO(patient.admissionDate));
      const discharge = patient.dischargeDate
        ? endOfDay(parseISO(patient.dischargeDate))
        : end;

      return isWithinInterval(currentDate, { start: admission, end: discharge });
    }).length;

    // Cap at total beds
    const cappedOccupied = Math.min(occupiedBeds, totalBeds);
    const bor = (cappedOccupied / totalBeds) * 100;
    totalOccupiedDays += cappedOccupied;

    dataPoints.push({
      date: currentDate.toISOString().split('T')[0],
      bor: parseFloat(bor.toFixed(1)),
      occupiedBeds: cappedOccupied,
      totalBeds,
    });
  }

  const bors = dataPoints.map((d) => d.bor);
  const averageBOR = bors.reduce((a, b) => a + b, 0) / bors.length;

  return {
    dataPoints,
    summary: {
      averageBOR: parseFloat(averageBOR.toFixed(1)),
      totalOccupiedDays,
      totalBeds,
      periodDays,
      peakBOR: Math.max(...bors),
      lowestBOR: Math.min(...bors),
    },
  };
}

/**
 * Calculate current BOR based on active patients and total beds
 */
export function calculateCurrentBOR(activePatients: number, totalBeds: number): number {
  if (totalBeds === 0) return 0;
  return parseFloat(((Math.min(activePatients, totalBeds) / totalBeds) * 100).toFixed(1));
}
