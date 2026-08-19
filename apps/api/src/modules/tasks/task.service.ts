import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyTaskRepository,
  KyselyUnitOfWork,
  type TaskActivityRow,
  type TaskRow,
} from '@m-square/database';
import type {
  TaskActivityDto,
  TaskDto,
  TaskListResponseDto,
  TaskQueryDto,
  TaskStatus,
  TaskSummaryDto,
} from '@m-square/contracts';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { AssignTaskDto } from './dto/assign-task.dto';

@Injectable()
export class TaskService {
  private readonly db = dbService.db;
  private readonly taskRepo = new KyselyTaskRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  private mapToDto(row: TaskRow): TaskDto {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
      assignedToUserId: row.assigned_to_user_id,
      createdByUserId: row.created_by_user_id,
      residentId: row.resident_id,
      invoiceId: row.invoice_id,
      paymentId: row.payment_id,
      inventoryItemId: row.inventory_item_id,
      procurementId: row.procurement_id,
      expenseId: row.expense_id,
      notificationId: row.notification_id,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapActivityToDto(row: TaskActivityRow): TaskActivityDto {
    return {
      id: row.id,
      taskId: row.task_id,
      action: row.action,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      performedByUserId: row.performed_by_user_id,
      note: row.note,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };
  }

  private async validateLinkedEntities(organizationId: string, dto: CreateTaskDto): Promise<void> {
    if (dto.residentId) {
      const res = await this.db
        .selectFrom('residents')
        .select('id')
        .where('id', '=', dto.residentId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!res) throw new BadRequestException(`Resident ${dto.residentId} does not belong to this organization`);
    }

    if (dto.invoiceId) {
      const inv = await this.db
        .selectFrom('invoices')
        .select('id')
        .where('id', '=', dto.invoiceId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!inv) throw new BadRequestException(`Invoice ${dto.invoiceId} does not belong to this organization`);
    }

    if (dto.paymentId) {
      const pay = await this.db
        .selectFrom('payments')
        .select('id')
        .where('id', '=', dto.paymentId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!pay) throw new BadRequestException(`Payment ${dto.paymentId} does not belong to this organization`);
    }

    if (dto.inventoryItemId) {
      const item = await this.db
        .selectFrom('mess_inventory_items')
        .select('id')
        .where('id', '=', dto.inventoryItemId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!item) throw new BadRequestException(`Inventory Item ${dto.inventoryItemId} does not belong to this organization`);
    }

    if (dto.procurementId) {
      const proc = await this.db
        .selectFrom('mess_procurements')
        .select('id')
        .where('id', '=', dto.procurementId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!proc) throw new BadRequestException(`Procurement ${dto.procurementId} does not belong to this organization`);
    }

    if (dto.expenseId) {
      const exp = await this.db
        .selectFrom('mess_expenses')
        .select('id')
        .where('id', '=', dto.expenseId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!exp) throw new BadRequestException(`Expense ${dto.expenseId} does not belong to this organization`);
    }

    if (dto.notificationId) {
      const notif = await this.db
        .selectFrom('notifications')
        .select('id')
        .where('id', '=', dto.notificationId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!notif) throw new BadRequestException(`Notification ${dto.notificationId} does not belong to this organization`);
    }

    if (dto.assignedToUserId) {
      const member = await this.db
        .selectFrom('organization_memberships')
        .select('user_id')
        .where('user_id', '=', dto.assignedToUserId)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();
      if (!member) throw new BadRequestException(`Assigned user ${dto.assignedToUserId} does not belong to this organization`);
    }
  }

  public async createTask(
    organizationId: string,
    createdByUserId: string,
    dto: CreateTaskDto
  ): Promise<TaskDto> {
    await this.validateLinkedEntities(organizationId, dto);

    return this.unitOfWork.runInTransaction(async (trx) => {
      if (dto.notificationId) {
        const existing = await trx
          .selectFrom('tasks')
          .selectAll()
          .where('organization_id', '=', organizationId)
          .where('notification_id', '=', dto.notificationId)
          .where('status', '!=', 'CANCELLED')
          .executeTakeFirst();
        if (existing) {
          return this.mapToDto(existing);
        }
      }

      const task = await this.taskRepo.createForOrganization(
        organizationId,
        {
          title: dto.title,
          description: dto.description || null,
          status: 'TODO',
          priority: dto.priority || 'MEDIUM',
          due_date: dto.dueDate ? new Date(dto.dueDate) : null,
          completed_at: null,
          cancelled_at: null,
          assigned_to_user_id: dto.assignedToUserId || null,
          created_by_user_id: createdByUserId,
          resident_id: dto.residentId || null,
          invoice_id: dto.invoiceId || null,
          payment_id: dto.paymentId || null,
          inventory_item_id: dto.inventoryItemId || null,
          procurement_id: dto.procurementId || null,
          expense_id: dto.expenseId || null,
          notification_id: dto.notificationId || null,
        },
        trx
      );

      await this.taskRepo.createActivity(
        {
          task_id: task.id,
          organization_id: organizationId,
          action: 'CREATED',
          previous_status: null,
          new_status: 'TODO',
          performed_by_user_id: createdByUserId,
          note: `Task created: ${dto.title}`,
        },
        trx
      );

      return this.mapToDto(task);
    });
  }

  public async listTasks(organizationId: string, query: TaskQueryDto): Promise<TaskListResponseDto> {
    const { data, total, page, pageSize, totalPages } = await this.taskRepo.list(organizationId, query);
    return {
      data: data.map((r) => this.mapToDto(r)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public async getSummary(organizationId: string, userId?: string): Promise<TaskSummaryDto> {
    return this.taskRepo.getSummary(organizationId, userId);
  }

  public async getTask(id: string, organizationId: string): Promise<TaskDto> {
    const task = await this.taskRepo.findById(id, organizationId);
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return this.mapToDto(task);
  }

  public async updateTask(
    id: string,
    organizationId: string,
    userId: string,
    dto: UpdateTaskDto
  ): Promise<TaskDto> {
    return this.unitOfWork.runInTransaction(async (trx) => {
      const existing = await this.taskRepo.findByIdForUpdate(id, organizationId, trx);
      if (!existing) throw new NotFoundException(`Task with ID ${id} not found`);

      if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
        throw new BadRequestException(`Cannot update historical task in state ${existing.status}`);
      }

      if (dto.assignedToUserId && dto.assignedToUserId !== existing.assigned_to_user_id) {
        const member = await trx
          .selectFrom('organization_memberships')
          .select('user_id')
          .where('user_id', '=', dto.assignedToUserId)
          .where('organization_id', '=', organizationId)
          .executeTakeFirst();
        if (!member) throw new BadRequestException(`Assigned user ${dto.assignedToUserId} does not belong to this organization`);
      }

      const updated = await this.taskRepo.updateForOrganization(
        id,
        organizationId,
        {
          title: dto.title !== undefined ? dto.title : existing.title,
          description: dto.description !== undefined ? dto.description : existing.description,
          priority: dto.priority !== undefined ? dto.priority : existing.priority,
          due_date: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : existing.due_date,
          assigned_to_user_id:
            dto.assignedToUserId !== undefined ? dto.assignedToUserId : existing.assigned_to_user_id,
        },
        trx
      );

      if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);

      await this.taskRepo.createActivity(
        {
          task_id: id,
          organization_id: organizationId,
          action: 'UPDATED',
          previous_status: existing.status,
          new_status: updated.status,
          performed_by_user_id: userId,
          note: 'Task details updated',
        },
        trx
      );

      return this.mapToDto(updated);
    });
  }

  public async startTask(id: string, organizationId: string, userId: string): Promise<TaskDto> {
    return this.unitOfWork.runInTransaction(async (trx) => {
      const existing = await this.taskRepo.findByIdForUpdate(id, organizationId, trx);
      if (!existing) throw new NotFoundException(`Task with ID ${id} not found`);

      if (existing.status === 'IN_PROGRESS') throw new BadRequestException('Task is already in progress');
      if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
        throw new BadRequestException(`Cannot start task in state ${existing.status}`);
      }

      const updated = await this.taskRepo.updateForOrganization(
        id,
        organizationId,
        { status: 'IN_PROGRESS' },
        trx
      );
      if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);

      await this.taskRepo.createActivity(
        {
          task_id: id,
          organization_id: organizationId,
          action: 'STARTED',
          previous_status: existing.status,
          new_status: 'IN_PROGRESS',
          performed_by_user_id: userId,
          note: 'Task started',
        },
        trx
      );

      return this.mapToDto(updated);
    });
  }

  public async completeTask(id: string, organizationId: string, userId: string): Promise<TaskDto> {
    return this.unitOfWork.runInTransaction(async (trx) => {
      const existing = await this.taskRepo.findByIdForUpdate(id, organizationId, trx);
      if (!existing) throw new NotFoundException(`Task with ID ${id} not found`);

      if (existing.status === 'COMPLETED') throw new BadRequestException('Task is already completed');
      if (existing.status === 'CANCELLED') throw new BadRequestException('Cannot complete a cancelled task');

      const now = new Date();
      const updated = await this.taskRepo.updateForOrganization(
        id,
        organizationId,
        { status: 'COMPLETED', completed_at: now },
        trx
      );
      if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);

      await this.taskRepo.createActivity(
        {
          task_id: id,
          organization_id: organizationId,
          action: 'COMPLETED',
          previous_status: existing.status,
          new_status: 'COMPLETED',
          performed_by_user_id: userId,
          note: 'Task marked as completed',
        },
        trx
      );

      return this.mapToDto(updated);
    });
  }

  public async cancelTask(id: string, organizationId: string, userId: string): Promise<TaskDto> {
    return this.unitOfWork.runInTransaction(async (trx) => {
      const existing = await this.taskRepo.findByIdForUpdate(id, organizationId, trx);
      if (!existing) throw new NotFoundException(`Task with ID ${id} not found`);

      if (existing.status === 'CANCELLED') throw new BadRequestException('Task is already cancelled');
      if (existing.status === 'COMPLETED') throw new BadRequestException('Cannot cancel a completed task');

      const now = new Date();
      const updated = await this.taskRepo.updateForOrganization(
        id,
        organizationId,
        { status: 'CANCELLED', cancelled_at: now },
        trx
      );
      if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);

      await this.taskRepo.createActivity(
        {
          task_id: id,
          organization_id: organizationId,
          action: 'CANCELLED',
          previous_status: existing.status,
          new_status: 'CANCELLED',
          performed_by_user_id: userId,
          note: 'Task cancelled',
        },
        trx
      );

      return this.mapToDto(updated);
    });
  }

  public async reopenTask(id: string, organizationId: string, userId: string): Promise<TaskDto> {
    return this.unitOfWork.runInTransaction(async (trx) => {
      const existing = await this.taskRepo.findByIdForUpdate(id, organizationId, trx);
      if (!existing) throw new NotFoundException(`Task with ID ${id} not found`);

      if (existing.status === 'TODO' || existing.status === 'IN_PROGRESS') {
        throw new BadRequestException(`Task is already active in state ${existing.status}`);
      }

      const updated = await this.taskRepo.updateForOrganization(
        id,
        organizationId,
        { status: 'TODO' },
        trx
      );
      if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);

      await this.taskRepo.createActivity(
        {
          task_id: id,
          organization_id: organizationId,
          action: 'REOPENED',
          previous_status: existing.status,
          new_status: 'TODO',
          performed_by_user_id: userId,
          note: 'Task reopened',
        },
        trx
      );

      return this.mapToDto(updated);
    });
  }

  public async assignTask(
    id: string,
    organizationId: string,
    userId: string,
    dto: AssignTaskDto
  ): Promise<TaskDto> {
    return this.unitOfWork.runInTransaction(async (trx) => {
      const existing = await this.taskRepo.findByIdForUpdate(id, organizationId, trx);
      if (!existing) throw new NotFoundException(`Task with ID ${id} not found`);

      if (dto.assignedToUserId) {
        const member = await trx
          .selectFrom('organization_memberships')
          .select('user_id')
          .where('user_id', '=', dto.assignedToUserId)
          .where('organization_id', '=', organizationId)
          .executeTakeFirst();
        if (!member) throw new BadRequestException(`Assigned user ${dto.assignedToUserId} does not belong to this organization`);
      }

      const updated = await this.taskRepo.updateForOrganization(
        id,
        organizationId,
        { assigned_to_user_id: dto.assignedToUserId || null },
        trx
      );
      if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);

      const action = dto.assignedToUserId ? 'ASSIGNED' : 'UNASSIGNED';
      await this.taskRepo.createActivity(
        {
          task_id: id,
          organization_id: organizationId,
          action,
          previous_status: existing.status,
          new_status: existing.status,
          performed_by_user_id: userId,
          note: dto.assignedToUserId ? `Assigned to user ${dto.assignedToUserId}` : 'Unassigned task',
        },
        trx
      );

      return this.mapToDto(updated);
    });
  }

  public async getTaskActivities(id: string, organizationId: string): Promise<TaskActivityDto[]> {
    const task = await this.taskRepo.findById(id, organizationId);
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    const rows = await this.taskRepo.getActivitiesForTask(id, organizationId);
    return rows.map((r) => this.mapActivityToDto(r));
  }

  public async getResidentTasks(residentId: string, organizationId: string): Promise<TaskDto[]> {
    const res = await this.db
      .selectFrom('residents')
      .select('id')
      .where('id', '=', residentId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    if (!res) throw new NotFoundException(`Resident ${residentId} not found`);

    const rows = await this.taskRepo.findTasksForResident(residentId, organizationId);
    return rows.map((r) => this.mapToDto(r));
  }
}
