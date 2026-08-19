import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateResidentApi, type UpdateResidentInput } from '../api/residents.api';
import type { ResidentDto } from '@m-square/contracts';

export function useUpdateResident(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateResidentInput) => updateResidentApi(residentId, payload),
    onSuccess: (updated: ResidentDto) => {
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.setQueryData(['resident', residentId], updated);
    },
  });
}
