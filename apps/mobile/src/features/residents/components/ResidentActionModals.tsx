import React from 'react';
import type { ResidentOperationalListItemDto } from '@m-square/contracts';
import { TransferBedModal } from './TransferBedModal';
import { CheckOutModal } from './CheckOutModal';
import { EditResidentFormValues, EditResidentModal } from './EditResidentModal';

interface ResidentActionModalsProps {
  transferTarget: ResidentOperationalListItemDto | null;
  onCloseTransfer: () => void;
  onConfirmTransfer: (targetBedId: string, notes?: string) => Promise<void>;
  isTransferring: boolean;

  checkOutTarget: ResidentOperationalListItemDto | null;
  onCloseCheckOut: () => void;
  onConfirmCheckOut: (dto: { actualCheckoutDate?: string; notes?: string }) => Promise<void>;
  isCheckingOut: boolean;

  editTarget: ResidentOperationalListItemDto | null;
  onCloseEdit: () => void;
  onSaveEdit: (values: EditResidentFormValues) => Promise<void>;
  isSavingEdit: boolean;
}

export function ResidentActionModals({
  transferTarget,
  onCloseTransfer,
  onConfirmTransfer,
  isTransferring,
  checkOutTarget,
  onCloseCheckOut,
  onConfirmCheckOut,
  isCheckingOut,
  editTarget,
  onCloseEdit,
  onSaveEdit,
  isSavingEdit,
}: ResidentActionModalsProps): React.JSX.Element {
  return (
    <>
      {transferTarget && transferTarget.allocationId && (
        <TransferBedModal
          visible={!!transferTarget}
          onClose={onCloseTransfer}
          residentName={transferTarget.fullName}
          allocationId={transferTarget.allocationId}
          currentLocation={{
            propertyName: transferTarget.propertyName || 'Unknown Property',
            buildingName: transferTarget.buildingName || 'Unknown Building',
            floorName: String(transferTarget.floorNumber ?? '-'),
            roomNumber: transferTarget.roomNumber || 'Unknown Room',
            bedNumber: transferTarget.bedNumber || 'Unknown Bed',
          }}
          onTransfer={onConfirmTransfer}
          isTransferring={isTransferring}
        />
      )}

      {checkOutTarget && (
        <CheckOutModal
          visible={!!checkOutTarget}
          onClose={onCloseCheckOut}
          residentName={checkOutTarget.fullName}
          residentCode={checkOutTarget.residentCode}
          outstandingBalance={checkOutTarget.outstandingBalance}
          onConfirm={onConfirmCheckOut}
          isSubmitting={isCheckingOut}
        />
      )}

      {editTarget && (
        <EditResidentModal
          visible={!!editTarget}
          onClose={onCloseEdit}
          resident={{
            id: editTarget.residentId,
            organizationId: '',
            residentCode: editTarget.residentCode,
            firstName: editTarget.fullName.split(' ')[0] || '',
            lastName: editTarget.fullName.split(' ').slice(1).join(' ') || '',
            phone: editTarget.phone || '',
            email: editTarget.email || undefined,
            gender: 'OTHER',
            status: 'ACTIVE',
            createdAt: '',
            updatedAt: '',
          }}
          onSave={onSaveEdit}
          isSaving={isSavingEdit}
        />
      )}
    </>
  );
}
