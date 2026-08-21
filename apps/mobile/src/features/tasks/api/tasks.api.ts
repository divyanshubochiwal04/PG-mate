import { apiClient } from '../../../api/client';
import type {
  CreateTaskDto,
  TaskActivityDto,
  TaskDto,
  TaskListResponseDto,
  TaskQueryDto,
  TaskSummaryDto,
  UpdateTaskDto,
} from '@m-square/contracts';

export async function getTasksApi(query?: TaskQueryDto): Promise<TaskListResponseDto> {
  const response = await apiClient.get<{ data: TaskListResponseDto }>('/tasks', { params: query });
  return response.data?.data ?? response.data;
}

export async function getTaskSummaryApi(): Promise<TaskSummaryDto> {
  const response = await apiClient.get<{ data: TaskSummaryDto }>('/tasks/summary');
  return response.data?.data ?? response.data;
}

export async function getTaskApi(id: string): Promise<TaskDto> {
  const response = await apiClient.get<{ data: TaskDto }>(`/tasks/${id}`);
  return response.data?.data ?? response.data;
}

export async function createTaskApi(data: CreateTaskDto): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>('/tasks', data);
  return response.data?.data ?? response.data;
}

export async function updateTaskApi(id: string, data: UpdateTaskDto): Promise<TaskDto> {
  const response = await apiClient.patch<{ data: TaskDto }>(`/tasks/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function startTaskApi(id: string): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>(`/tasks/${id}/start`);
  return response.data?.data ?? response.data;
}

export async function completeTaskApi(id: string): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>(`/tasks/${id}/complete`);
  return response.data?.data ?? response.data;
}

export async function cancelTaskApi(id: string): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>(`/tasks/${id}/cancel`);
  return response.data?.data ?? response.data;
}

export async function reopenTaskApi(id: string): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>(`/tasks/${id}/reopen`);
  return response.data?.data ?? response.data;
}

export async function assignTaskApi(id: string, assignedToUserId: string | null): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>(`/tasks/${id}/assign`, { assignedToUserId });
  return response.data?.data ?? response.data;
}

export async function unassignTaskApi(id: string): Promise<TaskDto> {
  const response = await apiClient.post<{ data: TaskDto }>(`/tasks/${id}/unassign`);
  return response.data?.data ?? response.data;
}

export async function getTaskActivityApi(id: string): Promise<TaskActivityDto[]> {
  const response = await apiClient.get<{ data: TaskActivityDto[] }>(`/tasks/${id}/activity`);
  return response.data?.data ?? response.data;
}

export async function getResidentTasksApi(residentId: string): Promise<TaskDto[]> {
  const response = await apiClient.get<{ data: TaskDto[] }>(`/tasks/resident/${residentId}`);
  return response.data?.data ?? response.data;
}

