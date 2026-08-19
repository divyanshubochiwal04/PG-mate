import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { CurrentOrganization } from '../tenant/decorators/current-organization.decorator';
import type { NotificationDto, NotificationListResponseDto, OrganizationDto } from '@m-square/contracts';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'List notifications with filters and pagination' })
  @SwaggerResponse({ status: 200, description: 'Notifications retrieved' })
  async listNotifications(
    @CurrentOrganization() organization: OrganizationDto,
    @Query() query: NotificationQueryDto
  ): Promise<NotificationListResponseDto> {
    return this.notificationService.listNotifications(organization.id, query);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Get unread notification count for tenant' })
  @SwaggerResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(
    @CurrentOrganization() organization: OrganizationDto
  ): Promise<{ count: number }> {
    return this.notificationService.getUnreadCount(organization.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Get single notification by ID' })
  @SwaggerResponse({ status: 200, description: 'Notification details retrieved' })
  @SwaggerResponse({ status: 404, description: 'Notification not found' })
  async getNotification(
    @CurrentOrganization() organization: OrganizationDto,
    @Param('id') id: string
  ): Promise<NotificationDto> {
    return this.notificationService.getNotification(id, organization.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @SwaggerResponse({ status: 200, description: 'All notifications marked read' })
  async markAllRead(
    @CurrentOrganization() organization: OrganizationDto
  ): Promise<{ updatedCount: number }> {
    return this.notificationService.markAllRead(organization.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Mark notification as read' })
  @SwaggerResponse({ status: 200, description: 'Notification marked read' })
  @SwaggerResponse({ status: 404, description: 'Notification not found' })
  async markRead(
    @CurrentOrganization() organization: OrganizationDto,
    @Param('id') id: string
  ): Promise<NotificationDto> {
    return this.notificationService.markRead(id, organization.id);
  }

  @Patch(':id/unread')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Mark notification as unread' })
  @SwaggerResponse({ status: 200, description: 'Notification marked unread' })
  @SwaggerResponse({ status: 404, description: 'Notification not found' })
  async markUnread(
    @CurrentOrganization() organization: OrganizationDto,
    @Param('id') id: string
  ): Promise<NotificationDto> {
    return this.notificationService.markUnread(id, organization.id);
  }

  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Resolve notification' })
  @SwaggerResponse({ status: 200, description: 'Notification resolved' })
  @SwaggerResponse({ status: 404, description: 'Notification not found' })
  async resolve(
    @CurrentOrganization() organization: OrganizationDto,
    @Param('id') id: string
  ): Promise<NotificationDto> {
    return this.notificationService.resolve(id, organization.id);
  }

  @Patch(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Dismiss notification' })
  @SwaggerResponse({ status: 200, description: 'Notification dismissed' })
  @SwaggerResponse({ status: 404, description: 'Notification not found' })
  async dismiss(
    @CurrentOrganization() organization: OrganizationDto,
    @Param('id') id: string
  ): Promise<NotificationDto> {
    return this.notificationService.dismiss(id, organization.id);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Trigger operational notification detection engine' })
  @SwaggerResponse({ status: 200, description: 'Detection engine executed' })
  async generateOperationalNotifications(
    @CurrentOrganization() organization: OrganizationDto
  ): Promise<{ generatedCount: number; resolvedCount: number }> {
    return this.notificationService.generateOperationalNotifications(organization.id);
  }
}
