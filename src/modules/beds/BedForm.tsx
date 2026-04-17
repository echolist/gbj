import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { Bed, BedFormData } from '../../types';

const bedSchema = z.object({
  bedNumber: z.string().min(1, 'Nomor tempat tidur wajib diisi'),
  roomType: z.string().min(1, 'Tipe ruangan wajib diisi'),
});

type FormValues = z.infer<typeof bedSchema>;

interface BedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BedFormData) => Promise<void>;
  bed?: Bed | null;
  isLoading?: boolean;
  existingBedNumbers?: string[];
}

const ROOM_TYPES = [
  'ICU',
  'ICCU',
  'HCU',
  'VIP',
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Isolasi',
  'Perinatologi',
  'IGD',
];

export function BedForm({
  isOpen,
  onClose,
  onSubmit,
  bed,
  isLoading,
  existingBedNumbers = [],
}: BedFormProps) {
  const isEdit = !!bed;

  const schema = bedSchema.refine(
    (data) => {
      if (!isEdit && existingBedNumbers.includes(data.bedNumber)) {
        return false;
      }
      return true;
    },
    {
      message: 'Nomor tempat tidur sudah digunakan',
      path: ['bedNumber'],
    }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bedNumber: bed?.bedNumber ?? '',
      roomType: bed?.roomType ?? '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        bedNumber: bed?.bedNumber ?? '',
        roomType: bed?.roomType ?? '',
      });
    }
  }, [isOpen, bed, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Tempat Tidur' : 'Tambah Tempat Tidur'}
      size="sm"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="label">Nomor Tempat Tidur *</label>
          <input
            {...register('bedNumber')}
            className="input"
            placeholder="mis. A-101"
            disabled={isEdit}
          />
          {errors.bedNumber && <p className="error-text">{errors.bedNumber.message}</p>}
        </div>

        <div>
          <label className="label">Tipe Ruangan *</label>
          <select {...register('roomType')} className="input">
            <option value="">Pilih Tipe Ruangan</option>
            {ROOM_TYPES.map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
          {errors.roomType && <p className="error-text">{errors.roomType.message}</p>}
        </div>

        <div className="flex gap-3 pt-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
