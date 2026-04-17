import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ScatterChart,
  Scatter,
  LabelList
} from 'recharts';
import { Activity, Users, BedDouble, AlertTriangle } from 'lucide-react';

interface SummaryRawData {
  "Pasien Masuk": number;
  "Pasien Keluar Hidup": number;
  "Pasien keluar mati <=48 jam": number;
  "Pasien keluar mati > 48 Jam": number;
  "Jumlah Kamar": number;
}

interface GraphItem {
  INDIKATOR: string;
  NILAI: number;
  X: string | number;
  Y: string | number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function SummaryPage() {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['summaryData'],
    queryFn: async () => {
      const response = await apiFetch<SummaryRawData[]>({ action: 'getAll', sheet: 'Summary' });
      return response && response.length > 0 ? response[0] : null;
    },
  });

  const { data: graphData, isLoading: isGraphLoading } = useQuery({
    queryKey: ['graphData'],
    queryFn: async () => {
      const response = await apiFetch<GraphItem[]>({ action: 'getAll', sheet: 'Graph' });
      return response || [];
    },
  });

  if (isLoading || isGraphLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
        <p>Gagal memuat data ringkasan.</p>
        <p className="text-sm opacity-80">{(error as Error).message}</p>
      </div>
    );
  }

  if (!rawData) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
        Tidak ada data indikator ditemukan di sheet Summary.
      </div>
    );
  }

  const rawIndicatorsChart = Object.entries(rawData).map(([key, value]) => ({
    name: key,
    value: Number(value) || 0,
  }));

  // Calculations
  const pasienKeluar = (Number(rawData["Pasien Keluar Hidup"]) || 0) +
    (Number(rawData["Pasien keluar mati <=48 jam"]) || 0) +
    (Number(rawData["Pasien keluar mati > 48 Jam"]) || 0);
  const jumlahKamar = Number(rawData["Jumlah Kamar"]) || 1; // avoid division by zero
  const pasienMasuk = Number(rawData["Pasien Masuk"]) || 0;

  const bto = parseFloat((pasienKeluar / jumlahKamar).toFixed(2));

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(String(val).replace(',', '.'));
  };

  let barberJohnsonLines: any[] = [];
  let rsPoint: any = null;

  if (graphData) {
    const btoData = graphData.find(d => d.INDIKATOR === 'BTO');
    const borData = graphData.find(d => d.INDIKATOR === 'BOR');
    const alosData = graphData.find(d => d.INDIKATOR === 'ALOS');
    const toiData = graphData.find(d => d.INDIKATOR === 'TOI');

    if (btoData && borData && alosData && toiData) {
      const btoVal = parseNum(btoData.NILAI);
      const btoX = parseNum(btoData.X);
      const period = btoVal * btoX;

      const getBORLine = (borP: number, name: string, isMain = false) => {
        const slope = borP / (100 - borP);
        let xEnd = 15;
        let yEnd = 15 * slope;
        if (yEnd > 15) {
           yEnd = 15;
           xEnd = 15 / slope;
        }
        return {
          name,
          isMain,
          data: [{ x: 0, y: 0 }, { x: xEnd, y: yEnd, label: name }],
          color: isMain ? "#ef4444" : "rgba(148, 163, 184, 0.4)"
        };
      };

      const getBTOLine = (btoV: number, name: string, isMain = false) => {
        const intercept = period / btoV;
        return {
           name,
           isMain,
           data: [{ x: intercept, y: 0 }, { x: intercept/2, y: intercept/2, label: name }, { x: 0, y: intercept }],
           color: isMain ? "#22c55e" : "rgba(148, 163, 184, 0.4)"
        };
      };

      barberJohnsonLines.push(getBORLine(50, "BOR 50%"));
      barberJohnsonLines.push(getBORLine(70, "BOR 70%"));
      barberJohnsonLines.push(getBORLine(75, "BOR 75%"));
      barberJohnsonLines.push(getBORLine(80, "BOR 80%"));
      barberJohnsonLines.push(getBORLine(90, "BOR 90%"));

      barberJohnsonLines.push(getBTOLine(12.5, "BTO 12.5"));
      barberJohnsonLines.push(getBTOLine(15, "BTO 15"));
      barberJohnsonLines.push(getBTOLine(20, "BTO 20"));
      barberJohnsonLines.push(getBTOLine(30, "BTO 30"));

      barberJohnsonLines.push(getBORLine(parseNum(borData.NILAI), `BOR ${parseNum(borData.NILAI).toFixed(2)}%`, true));
      barberJohnsonLines.push(getBTOLine(btoVal, `BTO ${btoVal.toFixed(2)}`, true));

      rsPoint = {
        name: "Titik RS",
        data: [{ x: parseNum(toiData.NILAI), y: parseNum(alosData.NILAI), label: "Titik RS" }],
        color: "#f59e0b"
      };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Indikator BOR LOS TOI BTO</h1>
          <p className="mt-1 text-slate-400">
            Analisis data pasien dari sheet "Summary"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-500/20 p-3 text-indigo-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">BTO (Bed Turn Over)</p>
              <h2 className="text-2xl font-bold text-white">{bto}x</h2>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Keluar (H+M)</p>
              <h2 className="text-2xl font-bold text-white">{pasienKeluar}</h2>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/20 p-3 text-blue-400">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Kamar</p>
              <h2 className="text-2xl font-bold text-white">{jumlahKamar}</h2>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-500/20 p-3 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Mati &gt;48 Jam</p>
              <h2 className="text-2xl font-bold text-white">{rawData["Pasien keluar mati > 48 Jam"]}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-xl p-6">
          <h3 className="mb-6 text-lg font-semibold text-white">Grafik Parameter Dasar</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rawIndicatorsChart} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.5rem',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {rawIndicatorsChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col justify-center">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Perhitungan Indikator RS</h3>
            <p className="text-slate-400 mb-4">
              Saat ini data yang tersedia adalah Pasien Masuk, Pasien Keluar, dan Jumlah Kamar.
              Untuk menghitung BOR dengan tepat, diperlukan <strong>Hari Perawatan (HP)</strong> dan <strong>Periode Hari</strong>.
              Untuk TOI dan LOS juga memerlukan Hari Perawatan / Lama Dirawat.
            </p>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-left space-y-2 mt-4">
              <p className="text-sm"><strong className="text-indigo-400">BOR (Bed Occupancy Rate):</strong> (HP / (Jumlah Kamar x Hari)) x 100%</p>
              <p className="text-sm"><strong className="text-indigo-400">LOS (Length of Stay):</strong> Jumlah Lama Dirawat / Pasien Keluar (Hidup+Mati)</p>
              <p className="text-sm"><strong className="text-indigo-400">TOI (Turn Over Interval):</strong> ((Jumlah Kamar x Hari) - HP) / Pasien Keluar</p>
              <p className="text-sm"><strong className="text-indigo-400">BTO (Bed Turn Over):</strong> Pasien Keluar / Jumlah Kamar = <span className="text-emerald-400 font-bold">{bto}x</span></p>
            </div>
          </div>
        </div>
      </div>

      {graphData && rsPoint && (
        <div className="glass rounded-xl p-6">
          <h3 className="mb-6 text-lg font-semibold text-white">Grafik Barber Johnson</h3>
          <div className="h-[600px] w-full bg-[#f8fafc] rounded-lg overflow-hidden p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  domain={[0, 15]} 
                  tickCount={16} 
                  stroke="#334155"
                  label={{ value: "Turn Over Interval (TOI)", position: "insideBottom", offset: -5, fill: "#334155" }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  domain={[0, 15]} 
                  tickCount={16} 
                  stroke="#334155"
                  label={{ value: "Average Length of Stay (ALOS)", angle: -90, position: "insideLeft", offset: 10, fill: "#334155" }} 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#fff', color: '#0f172a', borderRadius: '8px' }} 
                />
                
                {barberJohnsonLines.map((line, idx) => (
                  <Scatter 
                    key={`line-${idx}`}
                    name={line.name} 
                    data={line.data} 
                    fill={line.color}
                    line={{ stroke: line.color, strokeWidth: line.isMain ? 3 : 1.5 }}
                    shape={(props: any) => <circle cx={props.cx} cy={props.cy} r={0} />}
                  >
                    <LabelList dataKey="label" position="insideTopLeft" fill={line.color} fontSize={12} fontWeight={line.isMain ? "bold" : "normal"} offset={8} />
                  </Scatter>
                ))}

                <Scatter
                  name={rsPoint.name}
                  data={rsPoint.data}
                  fill={rsPoint.color}
                  shape="circle"
                >
                  <LabelList dataKey="label" position="top" fill={rsPoint.color} fontSize={14} fontWeight="bold" offset={10} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
