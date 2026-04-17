import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, Activity } from 'lucide-react';
import { usePatients } from '../../hooks/usePatients';
import { useBeds } from '../../hooks/useBeds';
import { calculateDailyBOR } from '../../services/analyticsService';
import { getDateRangeDefaults } from '../../utils/dateUtils';
import { LoadingSpinner, ErrorState } from '../../components/ui/States';
import { exportToCSV } from '../../utils/helpers';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const BOR_IDEAL = 75; // WHO recommendation

type ChartType = 'area' | 'bar';

export function AnalyticsPage() {
  const { data: patients = [], isLoading: loadingP, error: errorP, refetch: refetchP } = usePatients();
  const { data: beds = [], isLoading: loadingB, error: errorB, refetch: refetchB } = useBeds();

  const defaults = getDateRangeDefaults();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [chartType, setChartType] = useState<ChartType>('area');

  const { dataPoints, summary } = useMemo(
    () => calculateDailyBOR(patients, beds, startDate, endDate),
    [patients, beds, startDate, endDate]
  );

  // Format dates for chart
  const chartData = useMemo(
    () =>
      dataPoints.map((d) => ({
        ...d,
        dateLabel: format(parseISO(d.date), 'dd MMM', { locale: idLocale }),
      })),
    [dataPoints]
  );

  function handleExport() {
    exportToCSV(
      dataPoints.map((d) => ({
        Tanggal: d.date,
        'BOR (%)': d.bor,
        'Bed Terisi': d.occupiedBeds,
        'Total Bed': d.totalBeds,
      })),
      `BOR_${startDate}_${endDate}`
    );
  }

  const isLoading = loadingP || loadingB;
  const error = errorP || errorB;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-xl p-3 border border-white/10 shadow-xl">
          <p className="text-xs text-slate-400 mb-2">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
              {p.name}: {p.value}{p.name === 'BOR (%)' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analitik BOR</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bed Occupancy Rate — Tingkat Hunian Tempat Tidur
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex-1">
            <label className="label">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-700/50">
            <button
              onClick={() => setChartType('area')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                chartType === 'area' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                chartType === 'bar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Batang
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState onRetry={() => { refetchP(); refetchB(); }} />
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              label="BOR Rata-rata"
              value={`${summary.averageBOR}%`}
              icon={<Activity className="w-5 h-5" />}
              color={
                summary.averageBOR >= BOR_IDEAL
                  ? 'emerald'
                  : summary.averageBOR >= 50
                  ? 'amber'
                  : 'rose'
              }
            />
            <MetricCard
              label="BOR Tertinggi"
              value={`${summary.peakBOR}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="indigo"
            />
            <MetricCard
              label="BOR Terendah"
              value={`${summary.lowestBOR}%`}
              icon={<TrendingDown className="w-5 h-5" />}
              color="slate"
            />
            <MetricCard
              label="Total Bed"
              value={summary.totalBeds.toString()}
              icon={<BarChart3 className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              label="Hari Hunian"
              value={summary.totalOccupiedDays.toString()}
              icon={<Calendar className="w-5 h-5" />}
              color="teal"
            />
          </div>

          {/* BOR Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">
                Standar WHO: BOR ideal 75-85%
              </p>
              <span
                className={`text-sm font-bold ${
                  summary.averageBOR >= 75 && summary.averageBOR <= 85
                    ? 'text-emerald-400'
                    : summary.averageBOR < 75
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {summary.averageBOR >= 75 && summary.averageBOR <= 85
                  ? '✓ Ideal'
                  : summary.averageBOR < 75
                  ? '↓ Di bawah ideal'
                  : '↑ Di atas ideal'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  summary.averageBOR >= 75 && summary.averageBOR <= 85
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : summary.averageBOR < 75
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-500 to-rose-400'
                }`}
                style={{ width: `${Math.min(summary.averageBOR, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0%</span>
              <span>75% (ideal)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-6">
              Grafik BOR Harian
            </h3>
            {chartData.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                Tidak ada data untuk periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="borGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={BOR_IDEAL}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: 'Ideal 75%', fill: '#10b981', fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bor"
                      name="BOR (%)"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#borGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6366f1' }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={BOR_IDEAL}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: 'Ideal 75%', fill: '#10b981', fontSize: 11 }}
                    />
                    <Bar
                      dataKey="bor"
                      name="BOR (%)"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Occupied Beds Chart */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-6">
              Jumlah Bed Terisi per Hari
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="bedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="occupiedBeds"
                  name="Bed Terisi"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#bedGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

type MetricColor = 'emerald' | 'indigo' | 'slate' | 'purple' | 'teal' | 'amber' | 'rose';

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: MetricColor;
}) {
  const colorMap: Record<MetricColor, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    indigo: 'text-indigo-400 bg-indigo-500/10',
    slate: 'text-slate-400 bg-slate-800',
    purple: 'text-purple-400 bg-purple-500/10',
    teal: 'text-teal-400 bg-teal-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
