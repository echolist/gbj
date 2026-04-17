import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { bedService } from '../services/bedService';
import type { BedFormData } from '../types';
import { toast } from '../utils/toast';

export const BED_QUERY_KEY = ['beds'];

export function useBeds() {
  return useQuery({
    queryKey: BED_QUERY_KEY,
    queryFn: bedService.getAll,
    staleTime: 1000 * 30,
  });
}

export function useCreateBed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bedService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BED_QUERY_KEY });
      toast.success('Tempat tidur berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan tempat tidur: ${error.message}`);
    },
  });
}

export function useUpdateBed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BedFormData> }) =>
      bedService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BED_QUERY_KEY });
      toast.success('Data tempat tidur berhasil diperbarui');
    },
    onError: () => {
      toast.error('Gagal memperbarui tempat tidur');
    },
  });
}

export function useDeleteBed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bedService.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: BED_QUERY_KEY });
      const previous = queryClient.getQueryData(BED_QUERY_KEY);
      queryClient.setQueryData(BED_QUERY_KEY, (old: any[]) =>
        old?.filter((b) => b.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(BED_QUERY_KEY, context?.previous);
      toast.error('Gagal menghapus tempat tidur');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BED_QUERY_KEY });
      toast.success('Tempat tidur berhasil dihapus');
    },
  });
}

export function useAssignBed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bedId,
      patientId,
      patientName,
    }: {
      bedId: string;
      patientId: string;
      patientName: string;
    }) => bedService.assignPatient(bedId, patientId, patientName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BED_QUERY_KEY });
      toast.success('Pasien berhasil ditetapkan ke tempat tidur');
    },
    onError: () => {
      toast.error('Gagal menetapkan pasien ke tempat tidur');
    },
  });
}

export function useReleaseBed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bedService.releaseBed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BED_QUERY_KEY });
      toast.success('Tempat tidur berhasil dibebaskan');
    },
    onError: () => {
      toast.error('Gagal membebaskan tempat tidur');
    },
  });
}
