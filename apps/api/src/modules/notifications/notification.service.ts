import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyNotificationRepository,
  type NotificationRow,
} from '@m-square/database';
import type {
  CreateNotificationDto,
  NotificationDto,
  NotificationListResponseDto,
  NotificationQueryDto,
  NotificationType,
} from '@m-square/contracts';
import { NotificationDetectorService } from './notification-detector.service';

@Injectable()
export class NotificationService {
  private readonly db = dbService.db;
  private readonly notificationRepo = new KyselyNotificationRepository(this.db);
  private readonly detectorService = new NotificationDetectorService();

  private mapToDto(row: NotificationRow): NotificationDto {
    return {
      id: row.id,
      type: row.type as NotificationType,
      severity: row.severity,
      status: row.status,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actionRoute: row.action_route,
      metadata: row.metadata,
      createdAt: row.created_at
        ? new Date(row.created_at).toISOString()
        : new Date().toISOString(),
      readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    };
  }

  public async listNotifications(
    organizationId: string,
    query: NotificationQueryDto
  ): Promise<NotificationListResponseDto> {
    if (query.fromDate && query.toDate) {
      if (new Date(query.fromDate) > new Date(query.toDate)) {
        throw new BadRequestException('fromDate must be less than or equal to toDate');
      }
    }

    const { data, total, page, pageSize, totalPages } =
      await this.notificationRepo.findByOrganization(organizationId, query);
    const unreadCount = await this.notificationRepo.countUnread(organizationId);

    return {
      data: data.map((row) => this.mapToDto(row)),
      total,
      page,
      pageSize,
      totalPages,
      unreadCount,
    };
  }

  public async getNotification(
    id: string,
    organizationId: string
  ): Promise<NotificationDto> {
    const notification = await this.notificationRepo.findById(id, organizationId);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.mapToDto(notification);
  }

  public async getUnreadCount(organizationId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.countUnread(organizationId);
    return { count };
  }

  public async markRead(id: string, organizationId: string): Promise<NotificationDto> {
    const updated = await this.notificationRepo.markRead(id, organizationId);
    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.mapToDto(updated);
  }

  public async markUnread(id: string, organizationId: string): Promise<NotificationDto> {
    const updated = await this.notificationRepo.markUnread(id, organizationId);
    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.mapToDto(updated);
  }

  public async markAllRead(organizationId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await this.notificationRepo.markAllRead(organizationId);
    return { updatedCount };
  }

  public async resolve(id: string, organizationId: string): Promise<NotificationDto> {
    const updated = await this.notificationRepo.resolve(id, organizationId);
    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.mapToDto(updated);
  }

  public async dismiss(id: string, organizationId: string): Promise<NotificationDto> {
    const updated = await this.notificationRepo.dismiss(id, organizationId);
    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.mapToDto(updated);
  }

  public async createNotification(
    organizationId: string,
    dto: CreateNotificationDto
  ): Promise<NotificationDto> {
    const created = await this.notificationRepo.create(organizationId, {
      type: dto.type,
      severity: dto.severity || 'INFO',
      title: dto.title,
      message: dto.message,
      entity_type: dto.entityType || null,
      entity_id: dto.entityId || null,
      action_route: dto.actionRoute || null,
      metadata: dto.metadata || null,
      dedupe_key: dto.dedupeKey || null,
      status: 'UNREAD',
      read_at: null,
      resolved_at: null,
      expires_at: null,
    });
    return this.mapToDto(created);
  }

  public async generateOperationalNotifications(
    organizationId: string
  ): Promise<{ generatedCount: number; resolvedCount: number }> {
    return this.detectorService.generateOperationalNotifications(organizationId);
  }
}
