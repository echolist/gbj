import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { Patient, PatientFormData } from '../../types';
import { DischargeStatus } from '../../types';
import { getTodayISO } from '../../utils/dateUtils';
import { useBeds } from '../../hooks/useBeds';

const patientSchema = z
  .object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    dateOfBirth: z.string().min(1, 'Tanggal lahir wajib diisi'),
    bedNumber: z.string().min(1, 'Nomor tempat tidur wajib diisi'),
    room: z.string().min(1, 'Ruangan wajib diisi'),
    admissionDate: z.string().min(1, 'Tanggal masuk wajib diisi'),
    dischargeDate: z.string().nullable().optional(),
    dischargeStatus: z
      .enum([DischargeStatus.Recovered, DischargeStatus.Deceased, DischargeStatus.SelfDischarge])
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.dischargeDate && data.admissionDate) {
        return new Date(data.dischargeDate) >= new Date(data.admissionDate);
      }
      return true;
    },
    {
      message: 'Tanggal keluar harus setelah tanggal masuk',
      path: ['dischargeDate'],
    }
  );

type FormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => Promise<void>;
  patient?: Patient | null;
  isLoading?: boolean;
}

export function PatientForm({ isOpen, onClose, onSubmit, patient, isLoading }: PatientFormProps) {
  const isEdit = !!patient;
  const { data: beds = [] } = useBeds();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name ?? '',
      dateOfBirth: patient?.dateOfBirth ?? '',
      bedNumber: patient?.bedNumber ?? '',
      room: patient?.room ?? '',
      admissionDate: patient?.admissionDate ?? getTodayISO(),
      dischargeDate: patient?.dischargeDate ?? null,
      dischargeStatus: patient?.dischargeStatus ?? null,
    },
  });

  const dischargeDate = watch('dischargeDate');

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: patient?.name ?? '',
        dateOfBirth: patient?.dateOfBirth ?? '',
        bedNumber: patient?.bedNumber ?? '',
        room: patient?.room ?? '',
        admissionDate: patient?.admissionDate ?? getTodayISO(),
        dischargeDate: patient?.dischargeDate ?? null,
        dischargeStatus: patient?.dischargeStatus ?? null,
      });
    }
  }, [isOpen, patient, reset]);

  // Unique room types from beds
  const roomOptions = useMemo(() => {
    const rooms = [...new Set(beds.map((b) => b.roomType).filter(Boolean))];
    return rooms;
  }, [beds]);

  // Available beds filtered by room (if room selected)
  const room = watch('room');
  const availableBeds = useMemo(() => {
    return beds.filter(
      (b) =>
        (!room || b.roomType === room) &&
        (!b.isOccupied || b.bedNumber === patient?.bedNumber)
    );
  }, [beds, room, patient]);

  const handleFormSubmit = async (values: FormValues) => {
    const data: PatientFormData = {
      name: values.name,
      dateOfBirth: values.dateOfBirth,
      bedNumber: values.bedNumber,
      room: values.room,
      admissionDate: values.admissionDate,
      dischargeDate: values.dischargeDate || null,
      dischargeStatus: values.dischargeStatus || null,
    };
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label className="label">Nama Pasien *</label>
          <input
            {...register('name')}
            className="input"
            placeholder="Masukkan nama lengkap"
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="label">Tanggal Lahir *</label>
          <input {...register('dateOfBirth')} type="date" className="input" />
          {errors.dateOfBirth && <p className="error-text">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Room */}
          <div>
            <label className="label">Ruangan *</label>
            <select {...register('room')} className="input">
              <option value="">Pilih Ruangan</option>
              {roomOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="_manual">Lainnya</option>
            </select>
            {room === '_manual' && (
              <input {...register('room')} className="input mt-2" placeholder="Nama ruangan" />
            )}
            {errors.room && <p className="error-text">{errors.room.message}</p>}
          </div>

          {/* Bed Number */}
          <div>
            <label className="label">Nomor Tempat Tidur *</label>
            <select {...register('bedNumber')} className="input">
              <option value="">Pilih Tempat Tidur</option>
              {availableBeds.map((b) => (
                <option key={b.id} value={b.bedNumber}>
                  {b.bedNumber} {b.isOccupied ? '(Terisi)' : ''}
                </option>
              ))}
            </select>
            {errors.bedNumber && <p className="error-text">{errors.bedNumber.message}</p>}
          </div>
        </div>

        {/* Admission Date */}
        <div>
          <label className="label">Tanggal Masuk *</label>
          <input {...register('admissionDate')} type="date" className="input" />
          {errors.admissionDate && <p className="error-text">{errors.admissionDate.message}</p>}
        </div>

        {/* Discharge Section */}
        <div className="border border-slate-700/50 rounded-xl p-4 space-y-4">
          <p className="text-sm font-medium text-slate-300">Informasi Keluar (Opsional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Keluar</label>
              <input {...register('dischargeDate')} type="date" className="input" />
              {errors.dischargeDate && <p className="error-text">{errors.dischargeDate.message}</p>}
            </div>
            <div>
              <label className="label">Status Keluar</label>
              <select
                {...register('dischargeStatus')}
                className="input"
                disabled={!dischargeDate}
              >
                <option value="">Pilih Status</option>
                <option value={DischargeStatus.Recovered}>Sembuh</option>
                <option value={DischargeStatus.Deceased}>Meninggal</option>
                <option value={DischargeStatus.SelfDischarge}>Pulang APS</option>
              </select>
              {errors.dischargeStatus && (
                <p className="error-text">{errors.dischargeStatus.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Pasien'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
