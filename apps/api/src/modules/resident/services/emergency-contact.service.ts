import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  dbService,
  KyselyEmergencyContactRepository,
  KyselyResidentRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { EmergencyContactRow } from '@m-square/database';
import type { EmergencyContactDto } from '@m-square/contracts';
import type { CreateEmergencyContactDto } from '../dto/create-emergency-contact.dto';
import type { UpdateEmergencyContactDto } from '../dto/update-emergency-contact.dto';

@Injectable()
export class EmergencyContactService {
  private readonly db = dbService.db;
  private readonly residentRepo = new KyselyResidentRepository(this.db);
  private readonly contactRepo = new KyselyEmergencyContactRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  public async createContact(
    residentId: string,
    organizationId: string,
    dto: CreateEmergencyContactDto
  ): Promise<EmergencyContactDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const resident = await this.residentRepo.findByIdForOrganization(
        residentId,
        organizationId,
        trx
      );
      if (!resident) throw new NotFoundException('Resident not found');

      const existingContacts = await this.contactRepo.findAllByResident(
        residentId,
        organizationId,
        trx
      );

      // Rule: First contact is automatically primary, or if explicitly requested as primary, unset other primaries
      const isPrimary = dto.isPrimary ?? existingContacts.length === 0;
      if (isPrimary) {
        await this.contactRepo.unsetPrimaryForResident(residentId, organizationId, trx);
      }

      const row = await this.contactRepo.createForResident(
        organizationId,
        {
          residentId,
          name: dto.name,
          relationship: dto.relationship,
          phone: dto.phone,
          alternatePhone: dto.alternatePhone,
          isPrimary,
        },
        trx
      );

      return this.mapContactRow(row);
    });
  }

  public async getContacts(
    residentId: string,
    organizationId: string
  ): Promise<EmergencyContactDto[]> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) throw new NotFoundException('Resident not found');

    const rows = await this.contactRepo.findAllByResident(residentId, organizationId);
    return rows.map((r) => this.mapContactRow(r));
  }

  public async updateContact(
    id: string,
    organizationId: string,
    dto: UpdateEmergencyContactDto
  ): Promise<EmergencyContactDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const contact = await this.contactRepo.findByIdForOrganization(id, organizationId, trx);
      if (!contact) throw new NotFoundException('Emergency contact not found');

      const existingContacts = await this.contactRepo.findAllByResident(
        contact.resident_id,
        organizationId,
        trx
      );

      if (dto.isPrimary === false && contact.is_primary) {
        if (existingContacts.length === 1) {
          throw new BadRequestException('Cannot unset primary status on sole emergency contact');
        }
        // Promote another contact to primary first
        const nextPrimary = existingContacts.find((c) => c.id !== id);
        if (nextPrimary) {
          await this.contactRepo.updateForResident(
            nextPrimary.id,
            organizationId,
            { isPrimary: true },
            trx
          );
        }
      } else if (dto.isPrimary === true && !contact.is_primary) {
        await this.contactRepo.unsetPrimaryForResident(
          contact.resident_id,
          organizationId,
          trx
        );
      }

      const updated = await this.contactRepo.updateForResident(
        id,
        organizationId,
        {
          name: dto.name,
          relationship: dto.relationship,
          phone: dto.phone,
          alternatePhone: dto.alternatePhone,
          isPrimary: dto.isPrimary,
        },
        trx
      );

      if (!updated) throw new NotFoundException('Emergency contact not found');
      return this.mapContactRow(updated);
    });
  }

  public async deleteContact(id: string, organizationId: string): Promise<void> {
    await this.unitOfWork.runInTransaction(async (trx) => {
      const contact = await this.contactRepo.findByIdForOrganization(id, organizationId, trx);
      if (!contact) throw new NotFoundException('Emergency contact not found');

      const wasPrimary = contact.is_primary;
      const residentId = contact.resident_id;

      const deleted = await this.contactRepo.deleteForResident(id, organizationId, trx);
      if (!deleted) throw new NotFoundException('Emergency contact not found');

      // If deleted contact was primary, auto-promote next remaining contact if any
      if (wasPrimary) {
        const remaining = await this.contactRepo.findAllByResident(
          residentId,
          organizationId,
          trx
        );
        if (remaining.length > 0) {
          await this.contactRepo.updateForResident(
            remaining[0].id,
            organizationId,
            { isPrimary: true },
            trx
          );
        }
      }
    });
  }

  private mapContactRow(c: EmergencyContactRow): EmergencyContactDto {
    return {
      id: c.id,
      residentId: c.resident_id,
      organizationId: c.organization_id,
      name: c.name,
      relationship: c.relationship as EmergencyContactDto['relationship'],
      phone: c.phone,
      alternatePhone: c.alternate_phone,
      isPrimary: c.is_primary,
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at.toISOString(),
    };
  }
}
