import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from '@m-square/contracts';
import {
  assignTaskApi,
  cancelTaskApi,
  completeTaskApi,
  createTaskApi,
  getResidentTasksApi,
  getTaskActivityApi,
  getTaskApi,
  getTasksApi,
  getTaskSummaryApi,
  reopenTaskApi,
  startTaskApi,
  unassignTaskApi,
  updateTaskApi,
} from '../api/tasks.api';

export function useTasks(query?: TaskQueryDto) {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: () => getTasksApi(query),
  });
}

export function useTaskSummary() {
  return useQuery({
    queryKey: ['task-summary'],
    queryFn: getTaskSummaryApi,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => getTaskApi(id),
    enabled: Boolean(id && id !== 'index' && id !== 'undefined'),
  });
}

export function useTaskActivities(id: string) {
  return useQuery({
    queryKey: ['task-activities', id],
    queryFn: () => getTaskActivityApi(id),
    enabled: Boolean(id && id !== 'index' && id !== 'undefined'),
  });
}

export function useResidentTasks(residentId: string) {
  return useQuery({
    queryKey: ['resident-tasks', residentId],
    queryFn: () => getResidentTasksApi(residentId),
    enabled: Boolean(residentId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskDto) => createTaskApi(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (data.residentId) {
        queryClient.invalidateQueries({ queryKey: ['resident-tasks', data.residentId] });
      }
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => updateTaskApi(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', data.id] });
      if (data.residentId) {
        queryClient.invalidateQueries({ queryKey: ['resident-tasks', data.residentId] });
      }
    },
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startTaskApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', data.id] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeTaskApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', data.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCancelTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelTaskApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', data.id] });
    },
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reopenTaskApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', data.id] });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedToUserId }: { id: string; assignedToUserId: string | null }) =>
      assignedToUserId ? assignTaskApi(id, assignedToUserId) : unassignTaskApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-activities', data.id] });
    },
  });
}
