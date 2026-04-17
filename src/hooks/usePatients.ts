import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import type { PatientFormData } from '../types';
import { toast } from '../utils/toast';

export const PATIENT_QUERY_KEY = ['patients'];

export function usePatients() {
  return useQuery({
    queryKey: PATIENT_QUERY_KEY,
    queryFn: patientService.getAll,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEY });
      toast.success('Pasien berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan pasien: ${error.message}`);
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientFormData> }) =>
      patientService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PATIENT_QUERY_KEY });
      const previous = queryClient.getQueryData(PATIENT_QUERY_KEY);
      // Optimistic update
      queryClient.setQueryData(PATIENT_QUERY_KEY, (old: any[]) =>
        old?.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(PATIENT_QUERY_KEY, context?.previous);
      toast.error('Gagal memperbarui data pasien');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEY });
      toast.success('Data pasien berhasil diperbarui');
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientService.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PATIENT_QUERY_KEY });
      const previous = queryClient.getQueryData(PATIENT_QUERY_KEY);
      queryClient.setQueryData(PATIENT_QUERY_KEY, (old: any[]) =>
        old?.filter((p) => p.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(PATIENT_QUERY_KEY, context?.previous);
      toast.error('Gagal menghapus pasien');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEY });
      toast.success('Pasien berhasil dihapus');
    },
  });
}
