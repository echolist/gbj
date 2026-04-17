import React, { useMemo, useState } from 'react';
import { Search, User } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { usePatients } from '../../hooks/usePatients';
import { useAssignBed } from '../../hooks/useBeds';
import { LoadingSpinner } from '../../components/ui/States';
import { isActivePatient } from '../../utils/helpers';
import type { Bed } from '../../types';

interface AssignBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed | null;
}

export function AssignBedModal({ isOpen, onClose, bed }: AssignBedModalProps) {
  const { data: patients = [], isLoading } = usePatients();
  const assignBed = useAssignBed();
  const [search, setSearch] = useState('');

  // Only active patients without a bed assignment matching this bed
  const eligiblePatients = useMemo(() => {
    let result = patients.filter(isActivePatient);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [patients, search]);

  async function handleAssign(patientId: string, patientName: string) {
    if (!bed) return;
    await assignBed.mutateAsync({ bedId: bed.id, patientId, patientName });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tugaskan Pasien → Bed ${bed?.bedNumber}`}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Pilih pasien aktif yang belum memiliki tempat tidur:
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Cari nama pasien..."
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {isLoading ? (
            <LoadingSpinner text="Memuat pasien..." />
          ) : eligiblePatients.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              Tidak ada pasien aktif yang tersedia
            </p>
          ) : (
            eligiblePatients.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAssign(p.id, p.name)}
                disabled={assignBed.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    Kamar: {p.room} · Bed: {p.bedNumber}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
