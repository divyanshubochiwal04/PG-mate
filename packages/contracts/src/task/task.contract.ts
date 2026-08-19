export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REOPENED';

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  assignedToUserId: string | null;
  createdByUserId: string;
  residentId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  inventoryItemId: string | null;
  procurementId: string | null;
  expenseId: string | null;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskQueryDto {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToUserId?: string;
  residentId?: string;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TaskListResponseDto {
  data: TaskDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TaskSummaryDto {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  criticalTasks: number;
  myPendingTasks: number;
}

export interface TaskActivityDto {
  id: string;
  taskId: string;
  action: TaskActivityAction;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus | null;
  performedByUserId: string;
  note: string | null;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedToUserId?: string | null;
  residentId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  inventoryItemId?: string | null;
  procurementId?: string | null;
  expenseId?: string | null;
  notificationId?: string | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedToUserId?: string | null;
}
