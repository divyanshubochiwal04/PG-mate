import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { CurrentOrganization } from '../tenant/decorators/current-organization.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import type {
  TaskActivityDto,
  TaskDto,
  TaskListResponseDto,
  TaskSummaryDto,
} from '@m-square/contracts';

@Controller('tasks')
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  public async listTasks(
    @CurrentOrganization() organizationId: string,
    @Query() query: TaskQueryDto
  ): Promise<TaskListResponseDto> {
    return this.taskService.listTasks(organizationId, query);
  }

  @Get('summary')
  public async getSummary(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string
  ): Promise<TaskSummaryDto> {
    return this.taskService.getSummary(organizationId, userId);
  }

  @Get('resident/:residentId')
  public async getResidentTasks(
    @CurrentOrganization() organizationId: string,
    @Param('residentId') residentId: string
  ): Promise<TaskDto[]> {
    return this.taskService.getResidentTasks(residentId, organizationId);
  }

  @Get(':id')
  public async getTask(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string
  ): Promise<TaskDto> {
    return this.taskService.getTask(id, organizationId);
  }

  @Post()
  public async createTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto
  ): Promise<TaskDto> {
    return this.taskService.createTask(organizationId, userId, dto);
  }

  @Patch(':id')
  public async updateTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskDto> {
    return this.taskService.updateTask(id, organizationId, userId, dto);
  }

  @Post(':id/start')
  public async startTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<TaskDto> {
    return this.taskService.startTask(id, organizationId, userId);
  }

  @Post(':id/complete')
  public async completeTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<TaskDto> {
    return this.taskService.completeTask(id, organizationId, userId);
  }

  @Post(':id/cancel')
  public async cancelTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<TaskDto> {
    return this.taskService.cancelTask(id, organizationId, userId);
  }

  @Post(':id/reopen')
  public async reopenTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<TaskDto> {
    return this.taskService.reopenTask(id, organizationId, userId);
  }

  @Post(':id/assign')
  public async assignTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AssignTaskDto
  ): Promise<TaskDto> {
    return this.taskService.assignTask(id, organizationId, userId, dto);
  }

  @Post(':id/unassign')
  public async unassignTask(
    @CurrentOrganization() organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<TaskDto> {
    return this.taskService.assignTask(id, organizationId, userId, { assignedToUserId: null });
  }

  @Get(':id/activity')
  public async getTaskActivities(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string
  ): Promise<TaskActivityDto[]> {
    return this.taskService.getTaskActivities(id, organizationId);
  }
}
