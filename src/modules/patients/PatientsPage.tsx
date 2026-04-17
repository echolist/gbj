import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Filter,
  Users,
} from 'lucide-react';
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from '../../hooks/usePatients';
import { PatientForm } from './PatientForm';
import { ConfirmModal } from '../../components/ui/Modal';
import { PatientStatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/ui/States';
import { formatDate, calculateAge } from '../../utils/dateUtils';
import { isActivePatient } from '../../utils/helpers';
import type { Patient, PatientFormData } from '../../types';
import { DischargeStatus } from '../../types';

type SortKey = 'name' | 'admissionDate' | 'room' | 'bedNumber';
type SortDir = 'asc' | 'desc';

export function PatientsPage() {
  const { data: patients = [], isLoading, error, refetch } = usePatients();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  const [search, setSearch] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('admissionDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Unique room list
  const rooms = useMemo(() => [...new Set(patients.map((p) => p.room).filter(Boolean))], [patients]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...patients];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.bedNumber?.toLowerCase().includes(q) ||
          p.room?.toLowerCase().includes(q)
      );
    }
    if (filterRoom) result = result.filter((p) => p.room === filterRoom);
    if (filterStatus === 'active') result = result.filter((p) => isActivePatient(p));
    else if (filterStatus === DischargeStatus.Recovered) result = result.filter((p) => p.dischargeStatus === DischargeStatus.Recovered);
    else if (filterStatus === DischargeStatus.Deceased) result = result.filter((p) => p.dischargeStatus === DischargeStatus.Deceased);
    else if (filterStatus === DischargeStatus.SelfDischarge) result = result.filter((p) => p.dischargeStatus === DischargeStatus.SelfDischarge);
    if (activeOnly) result = result.filter((p) => isActivePatient(p));

    result.sort((a, b) => {
      const vA = a[sortKey] ?? '';
      const vB = b[sortKey] ?? '';
      const cmp = vA < vB ? -1 : vA > vB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [patients, search, filterRoom, filterStatus, activeOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  }

  async function handleSubmit(data: PatientFormData) {
    if (selectedPatient) {
      await updatePatient.mutateAsync({ id: selectedPatient.id, data });
    } else {
      await createPatient.mutateAsync(data);
    }
  }

  function openEdit(p: Patient) {
    setSelectedPatient(p);
    setFormOpen(true);
  }

  function openAdd() {
    setSelectedPatient(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (deleteId) {
      await deletePatient.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Pasien</h1>
          <p className="text-slate-400 text-sm mt-1">
            Total {patients.length} pasien · {patients.filter(isActivePatient).length} aktif
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          Tambah Pasien
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Cari nama, nomor bed, atau ruangan..."
            />
          </div>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="input sm:w-48"
          >
            <option value="">Semua Ruangan</option>
            {rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input sm:w-48"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value={DischargeStatus.Recovered}>Sembuh</option>
            <option value={DischargeStatus.Deceased}>Meninggal</option>
            <option value={DischargeStatus.SelfDischarge}>Pulang APS</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activeOnly"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <label htmlFor="activeOnly" className="text-sm text-slate-400 cursor-pointer">
            Tampilkan pasien aktif saja
          </label>
          <span className="ml-auto text-xs text-slate-500">
            {filtered.length} hasil ditemukan
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak Ada Pasien"
            description="Belum ada data pasien atau tidak ada yang sesuai filter"
            icon={<Users className="w-6 h-6" />}
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="w-4 h-4" />
                Tambah Pasien
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800/50">
                <tr>
                  <th
                    className="table-th cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <span className="flex items-center gap-1">
                      Nama <SortIcon col="name" />
                    </span>
                  </th>
                  <th className="table-th">Usia</th>
                  <th
                    className="table-th cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('room')}
                  >
                    <span className="flex items-center gap-1">
                      Ruangan <SortIcon col="room" />
                    </span>
                  </th>
                  <th
                    className="table-th cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('bedNumber')}
                  >
                    <span className="flex items-center gap-1">
                      No. Bed <SortIcon col="bedNumber" />
                    </span>
                  </th>
                  <th
                    className="table-th cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('admissionDate')}
                  >
                    <span className="flex items-center gap-1">
                      Tgl. Masuk <SortIcon col="admissionDate" />
                    </span>
                  </th>
                  <th className="table-th">Tgl. Keluar</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id} className="table-tr">
                    <td className="table-td font-medium text-white">{patient.name}</td>
                    <td className="table-td">
                      {calculateAge(patient.dateOfBirth)} th
                    </td>
                    <td className="table-td">{patient.room}</td>
                    <td className="table-td">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
                        {patient.bedNumber}
                      </span>
                    </td>
                    <td className="table-td">{formatDate(patient.admissionDate)}</td>
                    <td className="table-td">{formatDate(patient.dischargeDate)}</td>
                    <td className="table-td">
                      <PatientStatusBadge
                        status={patient.dischargeStatus}
                        active={isActivePatient(patient)}
                      />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(patient)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-500/10"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(patient.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Form Modal */}
      <PatientForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        patient={selectedPatient}
        isLoading={createPatient.isPending || updatePatient.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Pasien"
        description="Apakah Anda yakin ingin menghapus data pasien ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Pasien"
        isLoading={deletePatient.isPending}
      />
    </div>
  );
}
