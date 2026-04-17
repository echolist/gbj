import React, { useMemo } from 'react';
import {
  Users,
  BedDouble,
  Activity,
  TrendingUp,
  Calendar,
  ArrowRight,
  UserCheck,
  UserX,
  HeartPulse,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useBeds } from '../../hooks/useBeds';
import { calculateCurrentBOR, calculateDailyBOR } from '../../services/analyticsService';
import { getDateRangeDefaults } from '../../utils/dateUtils';
import { isActivePatient } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { PatientStatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/States';
import { DischargeStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function DashboardPage() {
  const { data: patients = [], isLoading: loadingP } = usePatients();
  const { data: beds = [], isLoading: loadingB } = useBeds();
  const { user } = useAuthStore();

  const defaults = getDateRangeDefaults();

  const activePatients = useMemo(() => patients.filter(isActivePatient), [patients]);
  const dischargedThisMonth = useMemo(
    () =>
      patients.filter((p) => {
        if (!p.dischargeDate) return false;
        const discharge = new Date(p.dischargeDate);
        const now = new Date();
        return (
          discharge.getMonth() === now.getMonth() &&
          discharge.getFullYear() === now.getFullYear()
        );
      }),
    [patients]
  );

  const occupiedBeds = beds.filter((b) => b.isOccupied).length;
  const currentBOR = calculateCurrentBOR(activePatients.length, beds.length);

  const { dataPoints } = useMemo(
    () => calculateDailyBOR(patients, beds, defaults.startDate, defaults.endDate),
    [patients, beds, defaults.startDate, defaults.endDate]
  );

  const chartData = dataPoints.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'dd/MM', { locale: idLocale }),
  }));

  const recentPatients = useMemo(
    () =>
      [...patients]
        .sort((a, b) => (a.admissionDate < b.admissionDate ? 1 : -1))
        .slice(0, 5),
    [patients]
  );

  const isLoading = loadingP || loadingB;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';

  if (isLoading) return <LoadingSpinner text="Memuat dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {format(now, "EEEE, d MMMM yyyy", { locale: idLocale })} — RS. Watik
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
          Sistem aktif
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Pasien"
          value={patients.length}
          sub={`${activePatients.length} aktif`}
          icon={<Users className="w-6 h-6" />}
          gradient="from-indigo-500/20 to-purple-500/10"
          iconBg="bg-indigo-500/20 text-indigo-400"
          to="/patients"
        />
        <KPICard
          title="Bed Terisi"
          value={occupiedBeds}
          sub={`dari ${beds.length} total bed`}
          icon={<BedDouble className="w-6 h-6" />}
          gradient="from-rose-500/20 to-pink-500/10"
          iconBg="bg-rose-500/20 text-rose-400"
          to="/beds"
        />
        <KPICard
          title="BOR Saat Ini"
          value={`${currentBOR}%`}
          sub="Standar WHO: 75-85%"
          icon={<Activity className="w-6 h-6" />}
          gradient="from-emerald-500/20 to-teal-500/10"
          iconBg="bg-emerald-500/20 text-emerald-400"
          to="/analytics"
        />
        <KPICard
          title="Keluar Bulan Ini"
          value={dischargedThisMonth.length}
          sub="pasien sudah keluar"
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-amber-500/20 to-orange-500/10"
          iconBg="bg-amber-500/20 text-amber-400"
          to="/patients"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* BOR Mini Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">BOR Bulan Ini</h2>
              <p className="text-xs text-slate-500 mt-0.5">{defaults.startDate} – {defaults.endDate}</p>
            </div>
            <Link to="/analytics" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Lihat detail <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="dashBorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#475569', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,15,35,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#818cf8' }}
                formatter={(v: number) => [`${v}%`, 'BOR']}
              />
              <Area
                type="monotone"
                dataKey="bor"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#dashBorGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Ringkasan Pasien</h2>
          <div className="space-y-3">
            <StatRow
              label="Pasien Aktif"
              value={activePatients.length}
              icon={<UserCheck className="w-4 h-4" />}
              color="text-emerald-400"
            />
            <StatRow
              label="Sembuh"
              value={patients.filter((p) => p.dischargeStatus === DischargeStatus.Recovered).length}
              icon={<UserCheck className="w-4 h-4" />}
              color="text-blue-400"
            />
            <StatRow
              label="Meninggal"
              value={patients.filter((p) => p.dischargeStatus === DischargeStatus.Deceased).length}
              icon={<UserX className="w-4 h-4" />}
              color="text-red-400"
            />
            <StatRow
              label="Pulang APS"
              value={patients.filter((p) => p.dischargeStatus === DischargeStatus.SelfDischarge).length}
              icon={<UserX className="w-4 h-4" />}
              color="text-amber-400"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Bed Tersedia</span>
              <span className="font-semibold text-emerald-400">
                {beds.filter((b) => !b.isOccupied).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Pasien Terbaru</h2>
          <Link
            to="/patients"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Lihat semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="table-th">Nama</th>
                <th className="table-th">Ruangan / Bed</th>
                <th className="table-th">Tgl. Masuk</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((p) => (
                <tr key={p.id} className="table-tr">
                  <td className="table-td font-medium text-white">{p.name}</td>
                  <td className="table-td">
                    <span className="text-slate-400">{p.room}</span>
                    {' / '}
                    <span className="font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded">
                      {p.bedNumber}
                    </span>
                  </td>
                  <td className="table-td">{formatDate(p.admissionDate)}</td>
                  <td className="table-td">
                    <PatientStatusBadge
                      status={p.dischargeStatus}
                      active={isActivePatient(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentPatients.length === 0 && (
            <p className="text-center text-slate-500 py-8 text-sm">Belum ada data pasien</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  sub,
  icon,
  gradient,
  iconBg,
  to,
}: {
  title: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={`card bg-gradient-to-br ${gradient} hover:scale-[1.02] transition-transform duration-200 cursor-pointer block`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600" />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-xs mt-1">{title}</p>
      <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
    </Link>
  );
}

function StatRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
