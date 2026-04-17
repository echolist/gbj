import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, User, UserX, BedDouble } from 'lucide-react';
import {
  useBeds,
  useCreateBed,
  useUpdateBed,
  useDeleteBed,
  useReleaseBed,
} from '../../hooks/useBeds';
import { BedForm } from './BedForm';
import { AssignBedModal } from './AssignBedModal';
import { ConfirmModal } from '../../components/ui/Modal';
import { BedStatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/ui/States';
import type { Bed, BedFormData } from '../../types';
import { cn } from '../../utils/helpers';

export function BedsPage() {
  const { data: beds = [], isLoading, error, refetch } = useBeds();
  const createBed = useCreateBed();
  const updateBed = useUpdateBed();
  const deleteBed = useDeleteBed();
  const releaseBed = useReleaseBed();

  const [search, setSearch] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'occupied' | 'available'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignBed, setAssignBed] = useState<Bed | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const roomTypes = useMemo(
    () => [...new Set(beds.map((b) => b.roomType).filter(Boolean))],
    [beds]
  );

  const existingBedNumbers = useMemo(() => beds.map((b) => b.bedNumber), [beds]);

  const filtered = useMemo(() => {
    let result = [...beds];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bedNumber.toLowerCase().includes(q) ||
          b.roomType.toLowerCase().includes(q) ||
          b.currentPatientName?.toLowerCase().includes(q)
      );
    }
    if (filterRoomType) result = result.filter((b) => b.roomType === filterRoomType);
    if (filterStatus === 'occupied') result = result.filter((b) => b.isOccupied);
    if (filterStatus === 'available') result = result.filter((b) => !b.isOccupied);
    return result;
  }, [beds, search, filterRoomType, filterStatus]);

  const stats = useMemo(() => ({
    total: beds.length,
    occupied: beds.filter((b) => b.isOccupied).length,
    available: beds.filter((b) => !b.isOccupied).length,
  }), [beds]);

  async function handleSubmit(data: BedFormData) {
    if (selectedBed) {
      await updateBed.mutateAsync({ id: selectedBed.id, data });
    } else {
      await createBed.mutateAsync(data);
    }
  }

  async function handleRelease() {
    if (releaseId) {
      await releaseBed.mutateAsync(releaseId);
      setReleaseId(null);
    }
  }

  async function handleDelete() {
    if (deleteId) {
      await deleteBed.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Tempat Tidur</h1>
          <p className="text-slate-400 text-sm mt-1">
            {stats.total} total · {stats.occupied} terisi · {stats.available} tersedia
          </p>
        </div>
        <button onClick={() => { setSelectedBed(null); setFormOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />
          Tambah Bed
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Bed"
          value={stats.total}
          color="indigo"
          icon={<BedDouble className="w-5 h-5" />}
        />
        <StatCard
          label="Terisi"
          value={stats.occupied}
          color="rose"
          icon={<User className="w-5 h-5" />}
        />
        <StatCard
          label="Tersedia"
          value={stats.available}
          color="emerald"
          icon={<UserX className="w-5 h-5" />}
        />
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Cari nomor bed, ruangan atau pasien..."
          />
        </div>
        <select
          value={filterRoomType}
          onChange={(e) => setFilterRoomType(e.target.value)}
          className="input sm:w-44"
        >
          <option value="">Semua Ruangan</option>
          {roomTypes.map((rt) => (
            <option key={rt} value={rt}>{rt}</option>
          ))}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-slate-700/50">
          {(['all', 'available', 'occupied'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-colors',
                filterStatus === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {s === 'all' ? 'Semua' : s === 'available' ? 'Tersedia' : 'Terisi'}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak Ada Tempat Tidur"
          description="Belum ada data tempat tidur yang sesuai filter"
          icon={<BedDouble className="w-6 h-6" />}
          action={
            <button onClick={() => setFormOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Tambah Bed
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((bed) => (
            <BedCard
              key={bed.id}
              bed={bed}
              onEdit={() => { setSelectedBed(bed); setFormOpen(true); }}
              onDelete={() => setDeleteId(bed.id)}
              onAssign={() => setAssignBed(bed)}
              onRelease={() => setReleaseId(bed.id)}
            />
          ))}
        </div>
      )}

      {/* Forms & Modals */}
      <BedForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        bed={selectedBed}
        isLoading={createBed.isPending || updateBed.isPending}
        existingBedNumbers={existingBedNumbers}
      />

      <AssignBedModal
        isOpen={!!assignBed}
        onClose={() => setAssignBed(null)}
        bed={assignBed}
      />

      <ConfirmModal
        isOpen={!!releaseId}
        onClose={() => setReleaseId(null)}
        onConfirm={handleRelease}
        title="Bebaskan Tempat Tidur"
        description="Apakah Anda yakin ingin membebaskan tempat tidur ini dari pasien yang ditugaskan?"
        confirmLabel="Bebaskan"
        isLoading={releaseBed.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Tempat Tidur"
        description="Apakah Anda yakin ingin menghapus tempat tidur ini? Pastikan tidak ada pasien yang sedang menempati."
        confirmLabel="Hapus"
        isLoading={deleteBed.isPending}
      />
    </div>
  );
}

// ─── Bed Card ─────────────────────────────────────────────────────────────────

function BedCard({
  bed,
  onEdit,
  onDelete,
  onAssign,
  onRelease,
}: {
  bed: Bed;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onRelease: () => void;
}) {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 border',
        bed.isOccupied
          ? 'border-rose-500/20 hover:border-rose-500/40'
          : 'border-emerald-500/20 hover:border-emerald-500/40'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-white text-lg leading-none">{bed.bedNumber}</p>
          <p className="text-xs text-slate-500 mt-0.5">{bed.roomType}</p>
        </div>
        <BedStatusBadge isOccupied={bed.isOccupied ?? false} />
      </div>

      {bed.isOccupied && bed.currentPatientName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-2.5 py-1.5">
          <User className="w-3 h-3 text-slate-500" />
          <span className="truncate">{bed.currentPatientName}</span>
        </div>
      )}

      <div className="flex gap-1.5 mt-auto">
        {bed.isOccupied ? (
          <button
            onClick={onRelease}
            className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            Bebaskan
          </button>
        ) : (
          <button
            onClick={onAssign}
            className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
          >
            Tugaskan
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'indigo' | 'rose' | 'emerald';
  icon: React.ReactNode;
}) {
  const colors = {
    indigo: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400',
    rose: 'from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
  };
  return (
    <div className={cn('rounded-2xl p-4 bg-gradient-to-br border', colors[color])}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
