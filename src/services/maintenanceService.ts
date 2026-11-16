import { apiClient } from './apiClient';
import type {
  MaintenanceBlock,
  MaintenanceBlockInput,
} from '../types/resource';

export async function listMaintenanceBlocks(
  params: { resourceId?: string } = {},
  signal?: AbortSignal,
) {
  const response = await apiClient.get<MaintenanceBlock[]>('/maintenance-blocks', {
    params,
    signal,
  });

  return response.data;
}

export async function createMaintenanceBlock(
  input: MaintenanceBlockInput,
  signal?: AbortSignal,
) {
  const response = await apiClient.post<MaintenanceBlock>(
    '/maintenance-blocks',
    input,
    { signal },
  );

  return response.data;
}

export async function deleteMaintenanceBlock(
  blockId: string,
  signal?: AbortSignal,
) {
  await apiClient.delete(`/maintenance-blocks/${blockId}`, { signal });
}