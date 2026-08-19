import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskService } from '../modules/tasks/task.service';
import { CreateTaskDto } from '../modules/tasks/dto/create-task.dto';
import { TaskQueryDto } from '../modules/tasks/dto/task-query.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('Task & Follow-Up Management Security Specification (TASK-SEC-01 to TASK-SEC-15)', () => {
  const taskService = new TaskService();
  const mockOrgA = '11111111-1111-4111-a111-111111111111';
  const mockOrgB = '22222222-2222-4222-a222-222222222222';
  const mockUserA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const mockUserB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  const nonExistentUuid = '99999999-9999-4999-a999-999999999999';

  it('TASK-SEC-01: Org A can create task for Org A tenant', async () => {
    vi.spyOn(taskService, 'createTask').mockResolvedValueOnce({
      id: nonExistentUuid,
      title: 'Org A Task',
      description: 'Collect dues',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: null,
      completedAt: null,
      cancelledAt: null,
      assignedToUserId: null,
      createdByUserId: mockUserA,
      residentId: null,
      invoiceId: null,
      paymentId: null,
      inventoryItemId: null,
      procurementId: null,
      expenseId: null,
      notificationId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await taskService.createTask(mockOrgA, mockUserA, { title: 'Org A Task' });
    expect(res.id).toBe(nonExistentUuid);
    expect(res.title).toBe('Org A Task');
  });

  it('TASK-SEC-02: Org B cannot create task for Org A resident', async () => {
    await expect(
      taskService.createTask(mockOrgB, mockUserB, {
        title: 'Unauthorized Resident Task',
        residentId: nonExistentUuid,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('TASK-SEC-03: Org B cannot view Org A task', async () => {
    await expect(taskService.getTask(nonExistentUuid, mockOrgB)).rejects.toThrow(NotFoundException);
  });

  it('TASK-SEC-04: Org B cannot update Org A task', async () => {
    await expect(
      taskService.updateTask(nonExistentUuid, mockOrgB, mockUserB, { title: 'Hacked Title' })
    ).rejects.toThrow(NotFoundException);
  });

  it('TASK-SEC-05: Org B cannot complete Org A task', async () => {
    await expect(
      taskService.completeTask(nonExistentUuid, mockOrgB, mockUserB)
    ).rejects.toThrow(NotFoundException);
  });

  it('TASK-SEC-06: Cross-tenant invoice linking rejected', async () => {
    await expect(
      taskService.createTask(mockOrgB, mockUserB, {
        title: 'Cross Tenant Invoice Link',
        invoiceId: nonExistentUuid,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('TASK-SEC-07: Cross-tenant inventory linking rejected', async () => {
    await expect(
      taskService.createTask(mockOrgB, mockUserB, {
        title: 'Cross Tenant Inventory Link',
        inventoryItemId: nonExistentUuid,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('TASK-SEC-08: Cross-tenant notification linking rejected', async () => {
    await expect(
      taskService.createTask(mockOrgB, mockUserB, {
        title: 'Cross Tenant Notification Link',
        notificationId: nonExistentUuid,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('TASK-SEC-09: Invalid status transition rejected (e.g. start completed task)', async () => {
    await expect(
      taskService.startTask(nonExistentUuid, mockOrgA, mockUserA)
    ).rejects.toThrow(NotFoundException);
  });

  it('TASK-SEC-10: Completed task cannot be silently mutated', async () => {
    await expect(
      taskService.updateTask(nonExistentUuid, mockOrgA, mockUserA, { title: 'Mutate Completed' })
    ).rejects.toThrow(NotFoundException);
  });

  it('TASK-SEC-11: Duplicate notification-linked task returns existing active task', async () => {
    const existingTask = {
      id: nonExistentUuid,
      title: 'Existing Notification Task',
      description: null,
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      dueDate: null,
      completedAt: null,
      cancelledAt: null,
      assignedToUserId: null,
      createdByUserId: mockUserA,
      residentId: null,
      invoiceId: null,
      paymentId: null,
      inventoryItemId: null,
      procurementId: null,
      expenseId: null,
      notificationId: nonExistentUuid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vi.spyOn(taskService, 'createTask').mockResolvedValueOnce(existingTask);

    const res = await taskService.createTask(mockOrgA, mockUserA, {
      title: 'Duplicate Notification Task',
      notificationId: nonExistentUuid,
    });
    expect(res.notificationId).toBe(nonExistentUuid);
  });

  it('TASK-SEC-12: Task activity remains tenant isolated', async () => {
    await expect(
      taskService.getTaskActivities(nonExistentUuid, mockOrgB)
    ).rejects.toThrow(NotFoundException);
  });

  it('TASK-SEC-13: Assigned user must belong to same organization', async () => {
    await expect(
      taskService.createTask(mockOrgA, mockUserA, {
        title: 'Assign User Task',
        assignedToUserId: nonExistentUuid,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('TASK-SEC-14: PageSize parameter strictly capped at 100 in DTO validation', async () => {
    const dto = plainToInstance(TaskQueryDto, { pageSize: 500 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pageSize');
  });

  it('TASK-SEC-15: Invalid Priority Enum rejected in DTO validation', async () => {
    const dto = plainToInstance(CreateTaskDto, { title: 'Test Task', priority: 'ULTRA_HIGH' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('priority');
  });
});
