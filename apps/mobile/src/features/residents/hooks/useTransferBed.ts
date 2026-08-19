import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferBedApi, type TransferInput } from '../api/residents.api';

export function useTransferBed(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ allocationId, data }: { allocationId: string; data: TransferInput }) =>
      transferBedApi(allocationId, data),
    onSuccess: (_data, variables) => {
      // Precise, targeted query invalidation
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['stays'] });
      queryClient.invalidateQueries({ queryKey: ['stay'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['building-tree'] });
      queryClient.invalidateQueries({ queryKey: ['building-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['building-details'] });
      queryClient.invalidateQueries({ queryKey: ['property-details'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
